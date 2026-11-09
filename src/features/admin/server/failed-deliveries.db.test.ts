import { describe, expect, it } from "vitest";
import { notificationDeliveries, outboxEvents, requireDb } from "@/db";
import { findFailedDeliveries } from "./failed-deliveries";

describe("findFailedDeliveries (DB-backed)", () => {
  it("lists only FAILED deliveries with event, recipient, attempts and error", async () => {
    expect(await findFailedDeliveries()).toEqual([]);

    const db = requireDb();
    const [event] = await db
      .insert(outboxEvents)
      .values({ type: "request.completed", payload: {} })
      .returning();
    await db.insert(notificationDeliveries).values([
      {
        eventId: event.id,
        recipient: "failed@test.bg",
        template: "request-completed",
        data: {},
        status: "FAILED",
        attempts: 5,
        lastError: "smtp down",
      },
      {
        eventId: event.id,
        recipient: "sent@test.bg",
        template: "request-completed",
        data: {},
        status: "SENT",
        attempts: 1,
      },
      {
        eventId: event.id,
        recipient: "pending@test.bg",
        template: "request-completed",
        data: {},
        status: "PENDING",
      },
    ]);

    expect(await findFailedDeliveries()).toEqual([
      expect.objectContaining({
        eventType: "request.completed",
        recipient: "failed@test.bg",
        attempts: 5,
        lastError: "smtp down",
      }),
    ]);
  });
});
