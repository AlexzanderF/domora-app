import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { requireDb, requests, subscriptions } from "@/db";
import type { Actor } from "@/domain/authorization";
import {
  cancelRequest,
  createRequest,
  listAll,
  startSubscription,
} from "@/domain/requests";
import type { CreateRequestInput } from "@/domain/requests";
import { UserRole } from "@/domain/identity/types";
import { SubscriptionPlan } from "@/domain/subscriptions/types";
import { createActor } from "../../../tests/db/factories";
import {
  cancelSubscription,
  createSubscription,
  getCurrentSubscription,
} from "./index";

const homePlan = {
  planType: SubscriptionPlan.Home,
  propertyAddress: "София, ул. Тест 1",
  propertyArea: 80,
  visitsPerMonth: 2,
};

const booking: CreateRequestInput = {
  category: 0,
  service: "Абонамент За дома",
  description: "Редовно почистване",
  address: "София, ул. Тест 1",
  expectedPrice: 45,
  scheduledDate: "2030-05-17",
  scheduledTime: "09:00 - 12:00",
};

let client: Actor;
let otherClient: Actor;
let specialist: Actor;
let admin: Actor;

beforeEach(async () => {
  client = await createActor(UserRole.Client);
  otherClient = await createActor(UserRole.Client);
  specialist = await createActor(UserRole.Specialist);
  admin = await createActor(UserRole.Admin);
});

async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (error: { code?: string }) => error.code ?? "UNKNOWN",
  );
}

async function visitsLeft(id: number) {
  const [row] = await requireDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, id));
  return row.visitsRemaining;
}

describe("createSubscription", () => {
  it("persists an active subscription for the signed-in client", async () => {
    const sub = await createSubscription(client, homePlan);

    expect(sub).toMatchObject({
      userId: client.id,
      planType: "HOME",
      propertyAddress: "София, ул. Тест 1",
      propertyArea: 80,
      status: "ACTIVE",
      visitsRemaining: 2,
    });
    expect(new Date(sub.validUntil).getTime()).toBeGreaterThan(Date.now());
    expect(await getCurrentSubscription(client)).toEqual(sub);
  });

  it("replaces the previous active subscription and keeps it as history", async () => {
    const first = await createSubscription(client, homePlan);
    const second = await createSubscription(client, {
      ...homePlan,
      planType: SubscriptionPlan.Entry,
      propertyArea: 6,
      visitsPerMonth: 4,
    });

    expect(second.id).not.toBe(first.id);
    expect((await getCurrentSubscription(client))?.id).toBe(second.id);
    const rows = await requireDb()
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, client.id));
    expect(rows.map((r) => [r.id, r.status]).sort()).toEqual(
      [
        [first.id, "CANCELLED"],
        [second.id, "ACTIVE"],
      ].sort(),
    );
  });

  it("rejects non-clients and visitors", async () => {
    expect(await rejection(createSubscription(null, homePlan))).toBe(
      "UNAUTHENTICATED",
    );
    expect(await rejection(createSubscription(specialist, homePlan))).toBe(
      "FORBIDDEN",
    );
    expect(await rejection(createSubscription(admin, homePlan))).toBe(
      "FORBIDDEN",
    );
  });

  it.each([
    { propertyAddress: "   " },
    { propertyArea: 0 },
    { propertyArea: 1001 },
    { propertyArea: 1.5 },
    { visitsPerMonth: 0 },
    { visitsPerMonth: 9 },
  ])("rejects invalid input %o", async (override) => {
    expect(
      await rejection(createSubscription(client, { ...homePlan, ...override })),
    ).toBe("INVALID_INPUT");
  });
});

describe("getCurrentSubscription", () => {
  it("is null without a subscription and never shows another client's", async () => {
    await createSubscription(client, homePlan);

    expect(await getCurrentSubscription(otherClient)).toBeNull();
  });

  it("falls back to the latest cancelled subscription", async () => {
    const sub = await createSubscription(client, homePlan);
    await cancelSubscription(client);

    expect(await getCurrentSubscription(client)).toMatchObject({
      id: sub.id,
      status: "CANCELLED",
    });
  });
});

describe("cancelSubscription", () => {
  it("cancels only the caller's own active subscription", async () => {
    const mine = await createSubscription(client, homePlan);
    const theirs = await createSubscription(otherClient, homePlan);

    await cancelSubscription(client);

    expect((await getCurrentSubscription(client))?.status).toBe("CANCELLED");
    expect((await getCurrentSubscription(otherClient))?.id).toBe(theirs.id);
    expect((await getCurrentSubscription(otherClient))?.status).toBe("ACTIVE");
    expect(mine.id).not.toBe(theirs.id);
  });
});

describe("booking a request against a subscription", () => {
  it("links the request and consumes one visit", async () => {
    const sub = await createSubscription(client, homePlan);

    const request = await createRequest(client, {
      ...booking,
      subscriptionId: sub.id,
    });

    expect(request.subscriptionId).toBe(sub.id);
    expect(await visitsLeft(sub.id)).toBe(1);
    expect((await getCurrentSubscription(client))?.visitsRemaining).toBe(1);
  });

  it("does not touch visits for a request without a subscription", async () => {
    const sub = await createSubscription(client, homePlan);

    const request = await createRequest(client, booking);

    expect(request.subscriptionId).toBeNull();
    expect(await visitsLeft(sub.id)).toBe(2);
  });

  it("refuses once the visits are used up, without creating the request", async () => {
    const sub = await createSubscription(client, {
      ...homePlan,
      visitsPerMonth: 1,
    });
    await createRequest(client, { ...booking, subscriptionId: sub.id });

    expect(
      await rejection(
        createRequest(client, { ...booking, subscriptionId: sub.id }),
      ),
    ).toBe("INVALID_STATE");
    expect(await visitsLeft(sub.id)).toBe(0);
    const rows = await requireDb()
      .select()
      .from(requests)
      .where(eq(requests.clientId, client.id));
    expect(rows).toHaveLength(1);
  });

  it("refuses a cancelled or expired subscription", async () => {
    const cancelled = await createSubscription(client, homePlan);
    await cancelSubscription(client);
    expect(
      await rejection(
        createRequest(client, { ...booking, subscriptionId: cancelled.id }),
      ),
    ).toBe("INVALID_STATE");

    const expired = await createSubscription(client, homePlan);
    await requireDb()
      .update(subscriptions)
      .set({ validUntil: new Date(Date.now() - 1000) })
      .where(eq(subscriptions.id, expired.id));
    expect(
      await rejection(
        createRequest(client, { ...booking, subscriptionId: expired.id }),
      ),
    ).toBe("INVALID_STATE");
    expect(await visitsLeft(expired.id)).toBe(2);
  });

  it("does not let a client spend someone else's visits", async () => {
    const theirs = await createSubscription(otherClient, homePlan);

    expect(
      await rejection(
        createRequest(client, { ...booking, subscriptionId: theirs.id }),
      ),
    ).toBe("NOT_FOUND");
    expect(await visitsLeft(theirs.id)).toBe(2);
  });

  it("never lets two concurrent bookings spend the same last visit", async () => {
    const sub = await createSubscription(client, {
      ...homePlan,
      visitsPerMonth: 1,
    });

    const results = await Promise.all([
      rejection(createRequest(client, { ...booking, subscriptionId: sub.id })),
      rejection(createRequest(client, { ...booking, subscriptionId: sub.id })),
    ]);

    expect(results.filter((r) => r === null)).toHaveLength(1);
    expect(await visitsLeft(sub.id)).toBe(0);
  });
});

describe("cancelling a request booked against a subscription", () => {
  it("gives the visit back", async () => {
    const sub = await createSubscription(client, homePlan);
    const request = await createRequest(client, {
      ...booking,
      subscriptionId: sub.id,
    });
    expect(await visitsLeft(sub.id)).toBe(1);

    await cancelRequest(client, request.id);

    expect(await visitsLeft(sub.id)).toBe(2);
  });
});

describe("startSubscription", () => {
  // 80 m² x 1.50 lev x 2 visits = 240 for the plan, so 120 per visit.
  const firstVisit = { ...booking, expectedPrice: 240 };

  it("saves the subscription and books the first visit against it", async () => {
    const { subscription, request } = await startSubscription(
      client,
      homePlan,
      firstVisit,
    );

    expect(request.subscriptionId).toBe(subscription.id);
    expect(await visitsLeft(subscription.id)).toBe(1);
  });

  it("prices the first visit on the server from the Tariffs", async () => {
    const { request } = await startSubscription(client, homePlan, firstVisit);

    expect(request.price).toBe(120);
  });

  it("rejects a stale or tampered price and leaves nothing behind", async () => {
    const previous = await createSubscription(client, homePlan);

    for (const expectedPrice of [1, 120, 0, 3_000_000_000]) {
      expect(
        await rejection(
          startSubscription(client, homePlan, { ...firstVisit, expectedPrice }),
        ),
      ).toBe("PRICE_CHANGED");
    }

    expect((await getCurrentSubscription(client))?.id).toBe(previous.id);
    expect(await listAll(admin)).toEqual([]);
  });

  it("leaves nothing behind when the booking is rejected", async () => {
    const previous = await createSubscription(client, homePlan);

    expect(
      await rejection(
        startSubscription(client, homePlan, {
          ...firstVisit,
          scheduledDate: "not-a-date",
        }),
      ),
    ).toBe("INVALID_INPUT");

    expect((await getCurrentSubscription(client))?.id).toBe(previous.id);
    expect((await getCurrentSubscription(client))?.status).toBe("ACTIVE");
  });
});
