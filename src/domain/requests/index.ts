import { desc, eq } from "drizzle-orm";
import { requestEvents, requests, requireDb, users } from "@/db";
import type { DomoraDatabase, RequestSelect } from "@/db";
import { can } from "@/domain/authorization";
import { enqueueEvent } from "@/domain/notifications";
import {
  consumeVisit,
  createSubscription,
  refundVisit,
} from "@/domain/subscriptions";
import type { CreateSubscriptionInput } from "@/domain/subscriptions";
import type { Subscription } from "@/domain/subscriptions/types";
import type { Action, Actor } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/domain/identity/types";
import {
  canCancelAsClient,
  canHandBack,
  canStartWork,
  canConfirmCompletion,
  canRate,
  isValidRating,
  requiresCompletionReport,
} from "./lifecycle";
import { RequestPriority, RequestStatus } from "@/domain/requests/types";
import type { CategoryId } from "@/domain/requests/types";

// Framework-free (no next/*): the requests module is the sole writer of
// request lifecycle state. Every function takes the Actor first and enforces
// it via can(); callers pass null for an unauthenticated visitor.

export type RequestErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "INVALID_STATE";

export class RequestError extends Error {
  constructor(
    readonly code: RequestErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

export interface CreateRequestInput {
  category: CategoryId;
  service: string;
  description: string;
  address: string;
  price: number;
  priority?: RequestPriority;
  // Preferred visit: a calendar day (YYYY-MM-DD) and the picked time window.
  scheduledDate: string;
  scheduledTime: string;
  // Book against one of the client's own subscriptions, consuming a visit.
  subscriptionId?: number;
}

// Serializable view of a request: timestamps are ISO strings, no Drizzle rows.
export interface RequestDto {
  id: number;
  clientId: number;
  specialistId: number | null;
  title: string;
  description: string;
  category: string;
  address: string;
  priority: RequestPriority;
  status: RequestStatus;
  price: number;
  clientPhone: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  cancelled: boolean;
  report: string | null;
  rating: number | null;
  issue: boolean;
  issueNote: string | null;
  recommendedSpecialistId: number | null;
  dispatchedByAdmin: boolean;
  subscriptionId: number | null;
  reportSubmittedAt: string | null;
  completedAt: string | null;
  ratedAt: string | null;
  issueOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Tx = Parameters<Parameters<DomoraDatabase["transaction"]>[0]>[0];

const iso = (date: Date | null): string | null => date?.toISOString() ?? null;

export function toDto(row: RequestSelect): RequestDto {
  return {
    id: row.id,
    clientId: row.clientId,
    specialistId: row.specialistId,
    title: row.title,
    description: row.description,
    category: row.category,
    address: row.address,
    priority: row.priority,
    status: row.status,
    price: row.price,
    clientPhone: row.clientPhone,
    scheduledDate: row.scheduledDate,
    scheduledTime: row.scheduledTime,
    cancelled: row.cancelled,
    report: row.report,
    rating: row.rating,
    issue: row.issue,
    issueNote: row.issueNote,
    recommendedSpecialistId: row.recommendedSpecialistId,
    dispatchedByAdmin: row.dispatchedByAdmin,
    subscriptionId: row.subscriptionId,
    reportSubmittedAt: iso(row.reportSubmittedAt),
    completedAt: iso(row.completedAt),
    ratedAt: iso(row.ratedAt),
    issueOpenedAt: iso(row.issueOpenedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function resourceOf(row: RequestSelect) {
  return { clientId: row.clientId, specialistId: row.specialistId };
}

export function requireActor(actor: Actor | null): Actor {
  if (!actor) {
    throw new RequestError("UNAUTHENTICATED", "Sign-in is required.");
  }
  return actor;
}

export function forbidden(): never {
  throw new RequestError("FORBIDDEN", "This actor may not do that.");
}

export function invalidState(message: string): never {
  throw new RequestError("INVALID_STATE", message);
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
  );
}

// Keeps the price well inside the integer column.
const MAX_PRICE = 1_000_000;

function validateBooking(input: CreateRequestInput) {
  const title = input.service.trim();
  const description = input.description.trim();
  const address = input.address.trim();
  const scheduledTime = input.scheduledTime.trim();

  if (!title || !address || description.length < 5) {
    throw new RequestError(
      "INVALID_INPUT",
      "Service, address and a description of at least 5 characters are required.",
    );
  }
  const price = Math.round(input.price);
  if (!(price > 0 && price <= MAX_PRICE)) {
    throw new RequestError(
      "INVALID_INPUT",
      `The price must be between 1 and ${MAX_PRICE}.`,
    );
  }
  if (
    !Number.isInteger(input.category) ||
    input.category < 0 ||
    input.category > 5
  ) {
    throw new RequestError("INVALID_INPUT", "Unknown category.");
  }
  if (!isCalendarDate(input.scheduledDate)) {
    throw new RequestError("INVALID_INPUT", "The date is not valid.");
  }
  if (!scheduledTime) {
    throw new RequestError("INVALID_INPUT", "A time window is required.");
  }
  return { title, description, address, scheduledTime, price };
}

export async function recordEvent(
  tx: Tx,
  event: {
    requestId: number;
    actorId: number;
    type: string;
    fromStatus: RequestStatus | null;
    toStatus: RequestStatus;
  },
): Promise<void> {
  await tx.insert(requestEvents).values(event);
}

interface Change {
  type: string;
  values: Partial<typeof requests.$inferInsert>;
  // Extra writes that must commit or roll back with the change.
  afterWrite?: (tx: Tx) => Promise<void>;
}

// Loads the request under a row lock, authorizes the actor against it, lets
// `apply` validate the transition and describe the change, then writes the
// change and its audit event in the same transaction.
async function mutate(
  actorOrNull: Actor | null,
  requestId: number,
  action: Action,
  apply: (row: RequestSelect, actor: Actor) => Change,
): Promise<RequestDto> {
  const actor = requireActor(actorOrNull);
  return requireDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(requests)
      .where(eq(requests.id, requestId))
      .for("update");
    if (!row) throw new RequestError("NOT_FOUND", "Request not found.");
    if (!can(actor, action, resourceOf(row))) forbidden();
    const change = apply(row, actor);
    const updated = await update(tx, row.id, change.values);
    await change.afterWrite?.(tx);
    await recordEvent(tx, {
      requestId: row.id,
      actorId: actor.id,
      type: change.type,
      fromStatus: row.status,
      toStatus: updated.status,
    });
    return toDto(updated);
  });
}

async function update(
  tx: Tx,
  requestId: number,
  values: Partial<typeof requests.$inferInsert>,
): Promise<RequestSelect> {
  const [row] = await tx
    .update(requests)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(requests.id, requestId))
    .returning();
  return row;
}

async function insertRequest(
  tx: Tx,
  actor: Actor,
  input: CreateRequestInput,
): Promise<RequestDto> {
  const booking = validateBooking(input);
  const [owner] = await tx
    .select({ phone: users.phone })
    .from(users)
    .where(eq(users.id, actor.id));
  if (!owner) forbidden();

  if (input.subscriptionId !== undefined) {
    const visit = await consumeVisit(tx, actor.id, input.subscriptionId);
    if (visit === "NOT_FOUND") {
      throw new RequestError("NOT_FOUND", "Subscription not found.");
    }
    if (visit === "UNAVAILABLE") {
      invalidState(
        "The subscription is inactive, expired or has no visits left.",
      );
    }
  }

  const [row] = await tx
    .insert(requests)
    .values({
      clientId: actor.id,
      title: booking.title,
      description: booking.description,
      category: String(input.category),
      address: booking.address,
      priority: input.priority ?? RequestPriority.Standard,
      status: RequestStatus.Created,
      price: booking.price,
      clientPhone: owner.phone,
      scheduledDate: input.scheduledDate,
      scheduledTime: booking.scheduledTime,
      subscriptionId: input.subscriptionId ?? null,
    })
    .returning();
  await recordEvent(tx, {
    requestId: row.id,
    actorId: actor.id,
    type: "request.created",
    fromStatus: null,
    toStatus: RequestStatus.Created,
  });
  await enqueueEvent(tx, {
    type: "request.created",
    payload: { requestId: row.id },
  });
  return toDto(row);
}

export async function createRequest(
  actorOrNull: Actor | null,
  input: CreateRequestInput,
): Promise<RequestDto> {
  const actor = requireActor(actorOrNull);
  if (!can(actor, "request.create")) forbidden();
  return requireDb().transaction((tx) => insertRequest(tx, actor, input));
}

// Starts a subscription and books its first visit in one transaction, so a
// rejected booking leaves no subscription behind.
export async function startSubscription(
  actorOrNull: Actor | null,
  plan: CreateSubscriptionInput,
  firstVisit: Omit<CreateRequestInput, "subscriptionId">,
): Promise<{ subscription: Subscription; request: RequestDto }> {
  const actor = requireActor(actorOrNull);
  if (!can(actor, "request.create")) forbidden();
  return requireDb().transaction(async (tx) => {
    const subscription = await createSubscription(actor, plan, tx);
    const request = await insertRequest(tx, actor, {
      ...firstVisit,
      subscriptionId: subscription.id,
    });
    return { subscription, request };
  });
}

export async function getRequest(
  actorOrNull: Actor | null,
  requestId: number,
): Promise<RequestDto> {
  const actor = requireActor(actorOrNull);
  const [row] = await requireDb()
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));
  if (!row) throw new RequestError("NOT_FOUND", "Request not found.");
  if (!can(actor, "request.view", resourceOf(row))) forbidden();
  return toDto(row);
}

// The requests an actor owns or works on: a client's own, a specialist's
// assigned, and everything for admins. Pending/Rejected specialists see none.
export async function listRequests(
  actorOrNull: Actor | null,
): Promise<RequestDto[]> {
  const actor = requireActor(actorOrNull);
  const db = requireDb();

  let where;
  switch (actor.role) {
    case UserRole.Admin:
      where = undefined;
      break;
    case UserRole.Client:
      where = eq(requests.clientId, actor.id);
      break;
    case UserRole.Specialist:
      if (actor.status !== UserStatus.Active) return [];
      where = eq(requests.specialistId, actor.id);
      break;
    default:
      return [];
  }

  const rows = await db
    .select()
    .from(requests)
    .where(where)
    .orderBy(desc(requests.createdAt), desc(requests.id));
  return rows.map(toDto);
}

export function startWork(
  actor: Actor | null,
  requestId: number,
): Promise<RequestDto> {
  return mutate(actor, requestId, "request.work", (row) => {
    if (!canStartWork(row)) {
      invalidState("Only an accepted request can be started.");
    }
    return {
      type: "request.started",
      values: { status: RequestStatus.InProgress },
    };
  });
}

// The specialist's work completion report: hands the request to the client
// for confirmation.
export function submitReport(
  actor: Actor | null,
  requestId: number,
  report: string,
): Promise<RequestDto> {
  const text = report?.trim();
  return mutate(actor, requestId, "request.work", (row) => {
    if (row.cancelled || !requiresCompletionReport(row.status)) {
      invalidState("Only a request in progress can be completed.");
    }
    if (!text) {
      throw new RequestError("INVALID_INPUT", "A report is required.");
    }
    return {
      type: "request.report_submitted",
      values: {
        status: RequestStatus.AwaitingConfirmation,
        report: text,
        reportSubmittedAt: new Date(),
      },
      afterWrite: (tx) =>
        enqueueEvent(tx, {
          type: "request.report_submitted",
          payload: { requestId: row.id },
        }),
    };
  });
}

// The client accepts the reported work.
export function confirmCompletion(
  actor: Actor | null,
  requestId: number,
): Promise<RequestDto> {
  return mutate(actor, requestId, "request.confirm", (row) => {
    if (!canConfirmCompletion(row)) {
      invalidState("There is no completed work awaiting confirmation.");
    }
    return {
      type: "request.completed",
      values: { status: RequestStatus.Completed, completedAt: new Date() },
    };
  });
}

export function rateRequest(
  actor: Actor | null,
  requestId: number,
  rating: number,
): Promise<RequestDto> {
  return mutate(actor, requestId, "request.rate", (row) => {
    if (!isValidRating(rating)) {
      throw new RequestError(
        "INVALID_INPUT",
        "The rating must be a whole number from 1 to 5.",
      );
    }
    if (!canRate(row, rating)) {
      invalidState("This request cannot be rated.");
    }
    return {
      type: "request.rated",
      values: { rating, ratedAt: new Date() },
    };
  });
}

// Clients and admins cancel the request.
export function cancelRequest(
  actor: Actor | null,
  requestId: number,
): Promise<RequestDto> {
  return mutate(actor, requestId, "request.cancel", (row) => {
    if (!canCancelAsClient(row)) {
      invalidState("This request can no longer be cancelled.");
    }
    const { subscriptionId } = row;
    return {
      type: "request.cancelled",
      values: { cancelled: true },
      // A cancelled booking gives its subscription visit back.
      afterWrite: subscriptionId
        ? (tx) => refundVisit(tx, subscriptionId)
        : undefined,
    };
  });
}

// Hand-back: the assigned specialist returns an accepted request to the open
// pool (it goes back to CREATED, unassigned).
export function releaseRequest(
  actor: Actor | null,
  requestId: number,
): Promise<RequestDto> {
  return mutate(actor, requestId, "request.release", (row) => {
    if (!canHandBack(row)) {
      invalidState("Only an accepted request can be handed back.");
    }
    return {
      type: "request.released",
      values: { specialistId: null, status: RequestStatus.Created },
    };
  });
}
