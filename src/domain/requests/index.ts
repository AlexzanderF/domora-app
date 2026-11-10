import { desc, eq } from "drizzle-orm";
import {
  requestEvents,
  requests,
  pricingSettings,
  requireDb,
  tariffs,
  users,
} from "@/db";
import type { RequestSelect } from "@/db";
import { can } from "@/domain/authorization";
import { enqueueEvent } from "@/domain/notifications";
import { calculateQuote, tariffsFromRows } from "@/domain/pricing";
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
import { toDto } from "./dto";
import type { RequestDto } from "./dto";
import { RequestError, forbidden, invalidState, requireActor } from "./errors";
import { resourceOf, transitionRequest } from "./transition";
import type { Change, Tx } from "./transition";
import { Plan, RequestPriority, RequestStatus } from "@/domain/requests/types";
import type { CategoryId } from "@/domain/requests/types";
import { SubscriptionPlan } from "@/domain/subscriptions/types";

// Subscription visits are booked under the general-maintenance category.
const SUBSCRIPTION_CATEGORY = 4;

// Framework-free (no next/*): the requests module is the sole writer of
// request lifecycle state. Every function takes the Actor first and enforces
// it via can(); callers pass null for an unauthenticated visitor.

export { RequestError, forbidden, invalidState, requireActor };
export type { RequestErrorCode } from "./errors";
export { resourceOf };
export { toDto } from "./dto";
export type { RequestDto } from "./dto";
export {
  listAgenda,
  listAll,
  listClientRequests,
  listTriage,
  specialistSummary,
} from "./read";
export type {
  AdminRequest,
  AgendaRequest,
  ClientRequest,
  SpecialistSummary,
} from "./read";
export { requestMetrics } from "./metrics";
export type { RequestMetrics } from "./metrics";
export type { Tx };

export interface CreateRequestInput {
  category: CategoryId;
  service: string;
  description: string;
  address: string;
  // The price the client was shown; the server computes the real price from
  // the current Tariffs and rejects the booking when the two differ.
  expectedPrice: number;
  // Index of the chosen service within its category (0 = standard service).
  serviceIndex?: number;
  // Plan-based quote inputs (area in m² or number of floors).
  plan?: Plan;
  quantity?: number;
  priority?: RequestPriority;
  // Preferred visit: a calendar day (YYYY-MM-DD) and the picked time window.
  scheduledDate: string;
  scheduledTime: string;
  // Book against one of the client's own subscriptions, consuming a visit.
  subscriptionId?: number;
}

// The fields every booking carries, whoever computes its price.
type BookingFields = Omit<
  CreateRequestInput,
  "expectedPrice" | "serviceIndex" | "plan" | "quantity"
>;

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
  );
}

// Keeps the price well inside the integer column.
const MAX_PRICE = 1_000_000;

function validateBooking(input: BookingFields) {
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
  return { title, description, address, scheduledTime };
}

function validatePrice(value: number): number {
  const price = Math.round(value);
  if (!(price > 0 && price <= MAX_PRICE)) {
    throw new RequestError(
      "INVALID_INPUT",
      `The price must be between 1 and ${MAX_PRICE}.`,
    );
  }
  return price;
}

// The server-side price of a one-off booking, from the current Tariffs.
async function quoteBooking(
  tx: Tx,
  input: CreateRequestInput,
): Promise<number> {
  const serviceIndex = input.serviceIndex ?? 0;
  if (!Number.isInteger(serviceIndex) || serviceIndex < 0) {
    throw new RequestError("INVALID_INPUT", "Unknown service.");
  }
  if (
    !Number.isInteger(input.category) ||
    input.category < 0 ||
    input.category > 5
  ) {
    throw new RequestError("INVALID_INPUT", "Unknown category.");
  }
  let price: number;
  try {
    price = calculateQuote(
      await currentTariffs(tx),
      input.category,
      serviceIndex,
      input.plan,
      input.quantity,
    );
  } catch {
    throw new RequestError("INVALID_INPUT", "The quote inputs are not valid.");
  }
  return validatePrice(price);
}

async function currentTariffs(tx: Tx) {
  const rows = await tx
    .select({
      category: tariffs.category,
      standardRate: tariffs.standardRate,
    })
    .from(tariffs);
  const [settings] = await tx.select().from(pricingSettings);
  return tariffsFromRows(rows, settings);
}

// The server-side prices of a Subscription: the plan total for its monthly
// visits, and the first visit's share of it.
async function quoteSubscription(
  tx: Tx,
  plan: CreateSubscriptionInput,
): Promise<{ total: number; firstVisit: number }> {
  const visits = plan.visitsPerMonth ?? 1;
  let total: number;
  try {
    total = calculateQuote(
      await currentTariffs(tx),
      SUBSCRIPTION_CATEGORY,
      0,
      plan.planType === SubscriptionPlan.Home ? Plan.Home : Plan.Entry,
      plan.propertyArea,
      visits,
    );
  } catch {
    throw new RequestError("INVALID_INPUT", "The quote inputs are not valid.");
  }
  return {
    total,
    firstVisit: validatePrice(Math.max(1, Math.round(total / visits))),
  };
}

// Request changes after creation: authorizes `action`, lets `apply` validate
// and describe the change, and writes it with its audit entry and outbox event.
async function mutate(
  actor: Actor | null,
  requestId: number,
  action: Action,
  apply: (row: RequestSelect) => Change,
): Promise<RequestDto> {
  const updated = await transitionRequest(actor, requestId, { action }, apply);
  return toDto(updated!);
}

async function insertRequest(
  tx: Tx,
  actor: Actor,
  input: BookingFields,
  price: number,
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
      price,
      clientPhone: owner.phone,
      scheduledDate: input.scheduledDate,
      scheduledTime: booking.scheduledTime,
      subscriptionId: input.subscriptionId ?? null,
    })
    .returning();
  await tx.insert(requestEvents).values({
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
  return requireDb().transaction(async (tx) => {
    const price = await quoteBooking(tx, input);
    if (Math.round(input.expectedPrice) !== price) {
      throw new RequestError(
        "PRICE_CHANGED",
        "The price changed since it was quoted.",
      );
    }
    return insertRequest(tx, actor, input, price);
  });
}

// Starts a subscription and books its first visit in one transaction, so a
// rejected booking leaves no subscription behind.
export async function startSubscription(
  actorOrNull: Actor | null,
  plan: CreateSubscriptionInput,
  // `expectedPrice` is the plan total the client was shown; the server
  // computes the real prices from the current Tariffs.
  firstVisit: Omit<BookingFields, "subscriptionId" | "category"> & {
    expectedPrice: number;
  },
): Promise<{ subscription: Subscription; request: RequestDto }> {
  const actor = requireActor(actorOrNull);
  if (!can(actor, "request.create")) forbidden();
  return requireDb().transaction(async (tx) => {
    const quote = await quoteSubscription(tx, plan);
    if (Math.round(firstVisit.expectedPrice) !== quote.total) {
      throw new RequestError(
        "PRICE_CHANGED",
        "The price changed since it was quoted.",
      );
    }
    const subscription = await createSubscription(actor, plan, tx);
    const request = await insertRequest(
      tx,
      actor,
      {
        ...firstVisit,
        category: SUBSCRIPTION_CATEGORY,
        subscriptionId: subscription.id,
      },
      quote.firstVisit,
    );
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
      event: { type: "request.started", payload: { requestId: row.id } },
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
      event: {
        type: "request.report_submitted",
        payload: { requestId: row.id },
      },
      values: {
        status: RequestStatus.AwaitingConfirmation,
        report: text,
        reportSubmittedAt: new Date(),
      },
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
      event: { type: "request.completed", payload: { requestId: row.id } },
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
      event: { type: "request.rated", payload: { requestId: row.id } },
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
      event: { type: "request.cancelled", payload: { requestId: row.id } },
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
      event: { type: "request.released", payload: { requestId: row.id } },
      values: { specialistId: null, status: RequestStatus.Created },
    };
  });
}
