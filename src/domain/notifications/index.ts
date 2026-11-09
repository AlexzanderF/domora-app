import { and, asc, eq, isNull, lte } from "drizzle-orm";
import { notificationDeliveries, outboxEvents, requireDb } from "@/db";
import type { DomoraDatabase, OutboxEventSelect } from "@/db";
import type { Notifier, NotificationMessage } from "./notifier";

// Framework-free (no next/*): the transactional outbox. Domain code calls
// enqueueEvent inside the transaction that changes state; the worker calls
// processOutbox to turn events into deliveries and send them.

export type Tx = Parameters<Parameters<DomoraDatabase["transaction"]>[0]>[0];

export const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 30_000;
const BATCH_SIZE = 50;

// Wait before retrying after the given (1-based) failed attempt.
export function backoffMs(attempt: number): number {
  return BASE_BACKOFF_MS * 2 ** (attempt - 1);
}

export interface OutboxEventInput {
  type: string;
  // Bump when the payload shape changes so old events stay readable.
  version?: number;
  payload: Record<string, unknown>;
}

export async function enqueueEvent(
  tx: Tx,
  event: OutboxEventInput,
): Promise<void> {
  await tx.insert(outboxEvents).values({
    type: event.type,
    version: event.version ?? 1,
    payload: event.payload,
  });
}

// Which messages an event produces. Receives the batch transaction, so a
// handler may look up recipients.
export type EventHandler = (
  event: OutboxEventSelect,
  tx: Tx,
) => NotificationMessage[] | Promise<NotificationMessage[]>;
export type EventHandlers = Record<string, EventHandler>;

// Registered per event type as notification tickets land.
export const defaultHandlers: EventHandlers = {};

export interface ProcessOptions {
  notifier: Notifier;
  handlers?: EventHandlers;
  now?: Date;
}

export interface ProcessResult {
  events: number;
  sent: number;
  retried: number;
  failed: number;
}

// Event -> deliveries. SKIP LOCKED lets several workers run side by side; the
// unique key makes a repeated fan-out harmless.
async function fanOut(handlers: EventHandlers, now: Date): Promise<number> {
  return requireDb().transaction(async (tx) => {
    const events = await tx
      .select()
      .from(outboxEvents)
      .where(isNull(outboxEvents.fannedOutAt))
      .orderBy(asc(outboxEvents.id))
      .limit(BATCH_SIZE)
      .for("update", { skipLocked: true });

    let done = 0;
    for (const event of events) {
      const handler = handlers[event.type];
      try {
        // Savepoint: a failing handler leaves no partial deliveries.
        await tx.transaction(async (sp) => {
          const messages = handler ? await handler(event, sp) : [];
          if (messages.length > 0) {
            await sp
              .insert(notificationDeliveries)
              .values(
                messages.map((m) => ({
                  eventId: event.id,
                  recipient: m.to,
                  template: m.template,
                  data: m.data,
                  nextAttemptAt: now,
                })),
              )
              .onConflictDoNothing();
          }
        });
      } catch (error) {
        // Left unprocessed so it is retried; the others carry on.
        console.error(`[outbox] handler failed for event ${event.id}:`, error);
        continue;
      }
      await tx
        .update(outboxEvents)
        .set({ fannedOutAt: now })
        .where(eq(outboxEvents.id, event.id));
      done += 1;
    }
    return done;
  });
}

// The row lock is held across the send, so two workers never send the same
// delivery. A crash between send and commit means a resend (at-least-once).
async function deliver(
  notifier: Notifier,
  now: Date,
): Promise<Pick<ProcessResult, "sent" | "retried" | "failed">> {
  return requireDb().transaction(async (tx) => {
    const due = await tx
      .select()
      .from(notificationDeliveries)
      .where(
        and(
          eq(notificationDeliveries.status, "PENDING"),
          lte(notificationDeliveries.nextAttemptAt, now),
        ),
      )
      .orderBy(asc(notificationDeliveries.id))
      .limit(BATCH_SIZE)
      .for("update", { skipLocked: true });

    const result = { sent: 0, retried: 0, failed: 0 };
    for (const delivery of due) {
      const attempts = delivery.attempts + 1;
      try {
        await notifier.send({
          to: delivery.recipient,
          template: delivery.template,
          data: delivery.data as Record<string, unknown>,
        });
        await tx
          .update(notificationDeliveries)
          .set({ status: "SENT", attempts, sentAt: now, lastError: null })
          .where(eq(notificationDeliveries.id, delivery.id));
        result.sent += 1;
      } catch (error) {
        const exhausted = attempts >= MAX_ATTEMPTS;
        await tx
          .update(notificationDeliveries)
          .set({
            status: exhausted ? "FAILED" : "PENDING",
            attempts,
            lastError: error instanceof Error ? error.message : String(error),
            nextAttemptAt: new Date(now.getTime() + backoffMs(attempts)),
          })
          .where(eq(notificationDeliveries.id, delivery.id));
        if (exhausted) result.failed += 1;
        else result.retried += 1;
      }
    }
    return result;
  });
}

export async function processOutbox(
  options: ProcessOptions,
): Promise<ProcessResult> {
  const now = options.now ?? new Date();
  const events = await fanOut(options.handlers ?? defaultHandlers, now);
  const delivered = await deliver(options.notifier, now);
  return { events, ...delivered };
}
