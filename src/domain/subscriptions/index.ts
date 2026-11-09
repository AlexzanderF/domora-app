import { and, desc, eq, gt, gte, sql } from "drizzle-orm";
import { requireDb, subscriptions, users } from "@/db";
import type { SubscriptionSelect } from "@/db";
import type { Actor } from "@/domain/authorization";
import { UserRole } from "@/domain/identity/types";
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/domain/subscriptions/types";
import type { Subscription } from "@/domain/subscriptions/types";

// Framework-free (no next/*): plan and visit accounting. A client keeps one
// ACTIVE subscription at a time; replaced and cancelled ones stay as history.
// The requests module spends visits through consumeVisit, in its own
// transaction.

export type SubscriptionErrorCode =
  "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID_INPUT";

export class SubscriptionError extends Error {
  constructor(
    readonly code: SubscriptionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SubscriptionError";
  }
}

export interface CreateSubscriptionInput {
  planType: SubscriptionPlan;
  propertyAddress: string;
  // Square metres for HOME, floors for ENTRY.
  propertyArea: number;
  // Visits granted for the period; defaults to the plan's standard count.
  visitsPerMonth?: number;
}

const VALIDITY_DAYS = 30;
const DEFAULT_VISITS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.Home]: 2,
  [SubscriptionPlan.Entry]: 4,
};
const MIN_VISITS = 1;
const MAX_VISITS = 8;
const MAX_AREA = 1000;

export type Tx = Parameters<
  Parameters<ReturnType<typeof requireDb>["transaction"]>[0]
>[0];

// An ACTIVE row past its validity is reported as EXPIRED.
function toDto(row: SubscriptionSelect): Subscription {
  const lapsed =
    row.status === SubscriptionStatus.Active &&
    row.validUntil.getTime() <= Date.now();
  return {
    id: row.id,
    userId: row.userId,
    planType: row.planType,
    propertyAddress: row.propertyAddress,
    propertyArea: row.propertyArea,
    status: lapsed ? SubscriptionStatus.Expired : row.status,
    visitsRemaining: row.visitsRemaining,
    validUntil: row.validUntil.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function requireClient(actorOrNull: Actor | null): Actor {
  if (!actorOrNull) {
    throw new SubscriptionError("UNAUTHENTICATED", "Sign-in is required.");
  }
  if (actorOrNull.role !== UserRole.Client) {
    throw new SubscriptionError(
      "FORBIDDEN",
      "Only clients hold subscriptions.",
    );
  }
  return actorOrNull;
}

function validate(input: CreateSubscriptionInput) {
  const address = input.propertyAddress?.trim();
  const visits = input.visitsPerMonth ?? DEFAULT_VISITS[input.planType];
  if (!Object.values(SubscriptionPlan).includes(input.planType)) {
    throw new SubscriptionError("INVALID_INPUT", "Unknown plan.");
  }
  if (!address) {
    throw new SubscriptionError("INVALID_INPUT", "An address is required.");
  }
  if (
    !Number.isInteger(input.propertyArea) ||
    input.propertyArea < 1 ||
    input.propertyArea > MAX_AREA
  ) {
    throw new SubscriptionError(
      "INVALID_INPUT",
      `The property size must be a whole number from 1 to ${MAX_AREA}.`,
    );
  }
  if (!Number.isInteger(visits) || visits < MIN_VISITS || visits > MAX_VISITS) {
    throw new SubscriptionError(
      "INVALID_INPUT",
      `Visits must be a whole number from ${MIN_VISITS} to ${MAX_VISITS}.`,
    );
  }
  return { address, visits };
}

// Starts a subscription for the client, cancelling any active one it replaces.
export async function createSubscription(
  actorOrNull: Actor | null,
  input: CreateSubscriptionInput,
  outerTx?: Tx,
): Promise<Subscription> {
  const actor = requireClient(actorOrNull);
  const { address, visits } = validate(input);

  // Joins the caller's transaction when given one.
  const run = <T>(work: (tx: Tx) => Promise<T>) =>
    outerTx ? work(outerTx) : requireDb().transaction(work);
  return run(async (tx) => {
    // Serializes a client's concurrent subscribes before the one-active index.
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, actor.id))
      .for("update");
    await tx
      .update(subscriptions)
      .set({ status: SubscriptionStatus.Cancelled, updatedAt: new Date() })
      .where(
        and(
          eq(subscriptions.userId, actor.id),
          eq(subscriptions.status, SubscriptionStatus.Active),
        ),
      );
    const [row] = await tx
      .insert(subscriptions)
      .values({
        userId: actor.id,
        planType: input.planType,
        propertyAddress: address,
        propertyArea: input.propertyArea,
        status: SubscriptionStatus.Active,
        visitsRemaining: visits,
        validUntil: new Date(Date.now() + VALIDITY_DAYS * 24 * 60 * 60 * 1000),
      })
      .returning();
    return toDto(row);
  });
}

// The client's active subscription, else their most recent one, else null.
export async function getCurrentSubscription(
  actorOrNull: Actor | null,
): Promise<Subscription | null> {
  const actor = requireClient(actorOrNull);
  const [row] = await requireDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, actor.id))
    .orderBy(
      desc(sql`${subscriptions.status} = 'ACTIVE'`),
      desc(subscriptions.createdAt),
      desc(subscriptions.id),
    )
    .limit(1);
  return row ? toDto(row) : null;
}

export async function cancelSubscription(
  actorOrNull: Actor | null,
): Promise<void> {
  const actor = requireClient(actorOrNull);
  await requireDb()
    .update(subscriptions)
    .set({ status: SubscriptionStatus.Cancelled, updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.userId, actor.id),
        eq(subscriptions.status, SubscriptionStatus.Active),
      ),
    );
}

// Gives back a visit spent on a request that was cancelled.
export async function refundVisit(
  tx: Tx,
  subscriptionId: number,
): Promise<void> {
  await tx
    .update(subscriptions)
    .set({
      visitsRemaining: sql`${subscriptions.visitsRemaining} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

export type ConsumeVisitResult = "CONSUMED" | "NOT_FOUND" | "UNAVAILABLE";

// Spends one visit of the client's own subscription inside the caller's
// transaction. The decrement is a single guarded UPDATE, so concurrent
// bookings cannot spend the same visit. NOT_FOUND covers an unknown id and
// another client's subscription alike; UNAVAILABLE means it is cancelled,
// expired or out of visits.
export async function consumeVisit(
  tx: Tx,
  clientId: number,
  subscriptionId: number,
): Promise<ConsumeVisitResult> {
  const consumed = await tx
    .update(subscriptions)
    .set({
      visitsRemaining: sql`${subscriptions.visitsRemaining} - 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, clientId),
        eq(subscriptions.status, SubscriptionStatus.Active),
        gt(subscriptions.validUntil, new Date()),
        gte(subscriptions.visitsRemaining, 1),
      ),
    )
    .returning({ id: subscriptions.id });
  if (consumed.length) return "CONSUMED";

  const [owned] = await tx
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, clientId),
      ),
    );
  return owned ? "UNAVAILABLE" : "NOT_FOUND";
}
