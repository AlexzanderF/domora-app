import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { notificationDeliveries, outboxEvents, requireDb } from "@/db";
import { MAX_ATTEMPTS, backoffMs, enqueueEvent, processOutbox } from "./index";
import type { EventHandlers } from "./index";
import type { Notifier, NotificationMessage } from "./notifier";

// Recipients per emitted event, keyed by the event's requestId.
const recipients = new Map<number, string[]>();
let nextId = 1;

const handlers: EventHandlers = {
  "request.completed": (event) => {
    const { requestId } = event.payload as { requestId: number };
    return (recipients.get(requestId) ?? []).map((address) => ({
      to: address,
      template: "request-completed",
      data: { title: "Смяна на кран" },
    }));
  },
};

function recordingNotifier(fail?: (m: NotificationMessage) => boolean) {
  const sent: NotificationMessage[] = [];
  const notifier: Notifier = {
    async send(message) {
      if (fail?.(message)) throw new Error("smtp down");
      sent.push(message);
    },
  };
  return { notifier, sent };
}

async function emit(to: string[]) {
  const requestId = nextId++;
  recipients.set(requestId, to);
  await requireDb().transaction((tx) =>
    enqueueEvent(tx, { type: "request.completed", payload: { requestId } }),
  );
}

async function deliveries() {
  return requireDb().select().from(notificationDeliveries);
}

const T0 = new Date("2026-01-01T10:00:00Z");

describe("enqueueEvent", () => {
  it("commits with the surrounding transaction", async () => {
    await emit(["a@example.com"]);
    const rows = await requireDb().select().from(outboxEvents);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "request.completed", version: 1 });
  });

  it("rolls back with the surrounding transaction", async () => {
    await requireDb()
      .transaction(async (tx) => {
        await enqueueEvent(tx, {
          type: "request.completed",
          payload: { requestId: 0 },
        });
        throw new Error("state change failed");
      })
      .catch(() => undefined);
    expect(await requireDb().select().from(outboxEvents)).toHaveLength(0);
  });
});

describe("processOutbox", () => {
  it("delivers once per recipient and marks the event processed", async () => {
    await emit(["a@example.com", "b@example.com"]);
    const { notifier, sent } = recordingNotifier();
    const result = await processOutbox({ notifier, handlers, now: T0 });
    expect(result).toMatchObject({ events: 1, sent: 2 });
    expect(sent.map((m) => m.to).sort()).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
    expect((await deliveries()).every((d) => d.status === "SENT")).toBe(true);
    const [event] = await requireDb().select().from(outboxEvents);
    expect(event.fannedOutAt).not.toBeNull();
  });

  it("does not send again when run twice", async () => {
    await emit(["a@example.com"]);
    const { notifier, sent } = recordingNotifier();
    await processOutbox({ notifier, handlers, now: T0 });
    await processOutbox({ notifier, handlers, now: T0 });
    expect(sent).toHaveLength(1);
  });

  it("does not double send when two workers run at once", async () => {
    await emit(["a@example.com", "b@example.com", "c@example.com"]);
    const sent: string[] = [];
    const notifier: Notifier = {
      async send(message) {
        await new Promise((r) => setTimeout(r, 20));
        sent.push(message.to);
      },
    };
    await Promise.all([
      processOutbox({ notifier, handlers, now: T0 }),
      processOutbox({ notifier, handlers, now: T0 }),
    ]);
    expect(sent.sort()).toEqual([
      "a@example.com",
      "b@example.com",
      "c@example.com",
    ]);
  });

  it("ignores events without a handler", async () => {
    await requireDb().transaction((tx) =>
      enqueueEvent(tx, {
        type: "password.reset_completed",
        payload: { userId: 1 },
      }),
    );
    const { notifier, sent } = recordingNotifier();
    await processOutbox({ notifier, handlers, now: T0 });
    expect(sent).toHaveLength(0);
    const [event] = await requireDb().select().from(outboxEvents);
    expect(event.fannedOutAt).not.toBeNull();
  });

  it("retries a failure with backoff, not before it is due", async () => {
    await emit(["a@example.com"]);
    let failing = true;
    const sent: string[] = [];
    const notifier: Notifier = {
      async send(m) {
        if (failing) throw new Error("smtp down");
        sent.push(m.to);
      },
    };
    await processOutbox({ notifier, handlers, now: T0 });
    let [row] = await deliveries();
    expect(row).toMatchObject({
      status: "PENDING",
      attempts: 1,
      lastError: "smtp down",
    });
    expect(row.nextAttemptAt.getTime()).toBe(T0.getTime() + backoffMs(1));

    failing = false;
    await processOutbox({ notifier, handlers, now: T0 });
    expect(sent).toHaveLength(0);

    const due = new Date(T0.getTime() + backoffMs(1));
    await processOutbox({ notifier, handlers, now: due });
    expect(sent).toEqual(["a@example.com"]);
    [row] = await deliveries();
    expect(row.status).toBe("SENT");
    expect(row.sentAt).not.toBeNull();
  });

  it("marks a delivery FAILED after the fifth failed attempt", async () => {
    await emit(["a@example.com"]);
    const { notifier } = recordingNotifier(() => true);
    let now = T0;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const [before] = await deliveries().then((r) => (r.length ? r : [null]));
      if (before) now = before.nextAttemptAt;
      await processOutbox({ notifier, handlers, now });
      const [row] = await deliveries();
      expect(row.attempts).toBe(attempt);
      expect(row.status).toBe(attempt < MAX_ATTEMPTS ? "PENDING" : "FAILED");
    }
    // A FAILED delivery is never picked up again.
    await processOutbox({
      notifier,
      handlers,
      now: new Date(now.getTime() + 10 * 86_400_000),
    });
    const [row] = await deliveries();
    expect(row.attempts).toBe(MAX_ATTEMPTS);
  });

  it("fails only the recipient whose send failed", async () => {
    await emit(["ok@example.com", "bad@example.com"]);
    const { notifier } = recordingNotifier((m) => m.to === "bad@example.com");
    await processOutbox({ notifier, handlers, now: T0 });
    const rows = await requireDb()
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.recipient, "ok@example.com"));
    expect(rows[0].status).toBe("SENT");
  });

  it("does not duplicate deliveries when an event is fanned out again", async () => {
    await emit(["a@example.com"]);
    const { notifier } = recordingNotifier(() => true);
    await processOutbox({ notifier, handlers, now: T0 });
    await requireDb().update(outboxEvents).set({ fannedOutAt: null });
    await processOutbox({ notifier, handlers, now: T0 });
    expect(await deliveries()).toHaveLength(1);
  });
});
