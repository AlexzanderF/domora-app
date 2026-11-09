import { desc, eq } from "drizzle-orm";
import { notificationDeliveries, outboxEvents, requireDb } from "@/db";

export interface FailedDelivery {
  id: number;
  eventType: string;
  recipient: string;
  attempts: number;
  lastError: string | null;
}

// Deliveries the worker gave up on after MAX_ATTEMPTS, newest first.
export async function findFailedDeliveries(): Promise<FailedDelivery[]> {
  return requireDb()
    .select({
      id: notificationDeliveries.id,
      eventType: outboxEvents.type,
      recipient: notificationDeliveries.recipient,
      attempts: notificationDeliveries.attempts,
      lastError: notificationDeliveries.lastError,
    })
    .from(notificationDeliveries)
    .innerJoin(
      outboxEvents,
      eq(outboxEvents.id, notificationDeliveries.eventId),
    )
    .where(eq(notificationDeliveries.status, "FAILED"))
    .orderBy(desc(notificationDeliveries.id));
}
