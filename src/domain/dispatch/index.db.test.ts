import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { requestEvents, requireDb, requests } from "@/db";
import type { Actor } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { RequestStatus } from "@/domain/requests/types";
import {
  createActor,
  insertProfile,
  insertRequest,
} from "../../../tests/db/factories";
import {
  assignSpecialist,
  claimRequest,
  declineRecommendation,
  listOpportunities,
  recommendRequest,
} from "./index";

let client: Actor;
let plumber: Actor;
let otherPlumber: Actor;
let electrician: Actor;
let farAwayPlumber: Actor;
let pending: Actor;
let rejected: Actor;
let admin: Actor;

beforeEach(async () => {
  client = await createActor(UserRole.Client);
  plumber = await createActor(UserRole.Specialist);
  otherPlumber = await createActor(UserRole.Specialist);
  electrician = await createActor(UserRole.Specialist);
  farAwayPlumber = await createActor(UserRole.Specialist);
  pending = await createActor(UserRole.Specialist, UserStatus.Pending);
  rejected = await createActor(UserRole.Specialist, UserStatus.Rejected);
  admin = await createActor(UserRole.Admin);
  await insertProfile(plumber.id, { category: "ВиК", area: "София" });
  await insertProfile(otherPlumber.id, { category: "ВиК", area: "София" });
  await insertProfile(electrician.id, { category: "Електро", area: "София" });
  await insertProfile(farAwayPlumber.id, { category: "ВиК", area: "Пловдив" });
  await insertProfile(pending.id, { category: "ВиК", area: "София" });
  await insertProfile(rejected.id, { category: "ВиК", area: "София" });
});

async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (error: { code?: string }) => error.code ?? "UNKNOWN",
  );
}

async function rowOf(id: number) {
  const [row] = await requireDb()
    .select()
    .from(requests)
    .where(eq(requests.id, id));
  return row;
}

async function eventsOf(id: number) {
  const rows = await requireDb()
    .select()
    .from(requestEvents)
    .where(eq(requestEvents.requestId, id))
    .orderBy(requestEvents.id);
  return rows.map((r) => [r.type, r.fromStatus, r.toStatus, r.actorId]);
}

const openPlumbing = () =>
  insertRequest({
    clientId: client.id,
    category: "0",
    address: "София, ул. Тест 1",
  });

describe("listOpportunities", () => {
  it("shows an active specialist only unassigned jobs matching trade and area", async () => {
    const match = await openPlumbing();
    await insertRequest({
      clientId: client.id,
      category: "1",
      address: "София, ул. Тест 1",
    });
    await insertRequest({
      clientId: client.id,
      category: "0",
      address: "Варна, ул. Тест 1",
    });
    await insertRequest({
      clientId: client.id,
      category: "0",
      address: "София, ул. Тест 1",
      specialistId: otherPlumber.id,
      status: RequestStatus.Accepted,
    });
    await insertRequest({
      clientId: client.id,
      category: "0",
      address: "София, ул. Тест 1",
      cancelled: true,
    });

    const jobs = await listOpportunities(plumber);

    expect(jobs.map((j) => j.id)).toEqual([match]);
  });

  it("floats jobs recommended to the specialist to the top", async () => {
    const first = await openPlumbing();
    const second = await openPlumbing();
    await recommendRequest(admin, first, plumber.id);

    expect((await listOpportunities(plumber)).map((j) => j.id)).toEqual([
      first,
      second,
    ]);
    expect((await listOpportunities(otherPlumber)).map((j) => j.id)).toEqual([
      second,
      first,
    ]);
  });

  it("shows Pending and Rejected specialists and clients nothing", async () => {
    await openPlumbing();

    expect(await listOpportunities(pending)).toEqual([]);
    expect(await listOpportunities(rejected)).toEqual([]);
    expect(await listOpportunities(client)).toEqual([]);
  });

  it("shows an admin every unassigned open job", async () => {
    const a = await openPlumbing();
    const b = await insertRequest({
      clientId: client.id,
      category: "1",
      address: "Варна",
    });

    expect((await listOpportunities(admin)).map((j) => j.id).sort()).toEqual(
      [a, b].sort(),
    );
  });

  it("requires an actor", async () => {
    expect(await rejection(listOpportunities(null))).toBe("UNAUTHENTICATED");
  });
});

describe("claimRequest", () => {
  it("assigns the job to a matching active specialist and records an event", async () => {
    const id = await openPlumbing();

    const claimed = await claimRequest(plumber, id);

    expect(claimed).toMatchObject({
      specialistId: plumber.id,
      status: RequestStatus.Accepted,
    });
    expect(await eventsOf(id)).toEqual([
      ["request.accepted", "CREATED", "ACCEPTED", plumber.id],
    ]);
  });

  it("clears a recommendation once the job is claimed", async () => {
    const id = await openPlumbing();
    await recommendRequest(admin, id, plumber.id);

    await claimRequest(plumber, id);

    expect(await rowOf(id)).toMatchObject({
      recommendedSpecialistId: null,
      recommendedById: null,
      recommendedAt: null,
    });
  });

  it("lets exactly one of two concurrent claims win", async () => {
    const id = await openPlumbing();

    const results = await Promise.all([
      rejection(claimRequest(plumber, id)),
      rejection(claimRequest(otherPlumber, id)),
    ]);

    expect(results.filter((r) => r === null)).toHaveLength(1);
    expect(results.filter((r) => r === "INVALID_STATE")).toHaveLength(1);
    const row = await rowOf(id);
    expect([plumber.id, otherPlumber.id]).toContain(row.specialistId);
    expect(await eventsOf(id)).toHaveLength(1);
  });

  it("rejects a second claim on an assigned job", async () => {
    const id = await openPlumbing();
    await claimRequest(plumber, id);

    expect(await rejection(claimRequest(otherPlumber, id))).toBe(
      "INVALID_STATE",
    );
    expect((await rowOf(id)).specialistId).toBe(plumber.id);
  });

  it("answers FORBIDDEN, not INVALID_STATE, to outsiders probing an assigned job", async () => {
    const id = await openPlumbing();
    await claimRequest(plumber, id);

    expect(await rejection(claimRequest(pending, id))).toBe("FORBIDDEN");
    expect(await rejection(claimRequest(client, id))).toBe("FORBIDDEN");
  });

  it("rejects cancelled requests", async () => {
    const id = await insertRequest({
      clientId: client.id,
      category: "0",
      address: "София",
      cancelled: true,
    });
    expect(await rejection(claimRequest(plumber, id))).toBe("INVALID_STATE");
  });

  it("rejects Pending, Rejected and client actors", async () => {
    const id = await openPlumbing();

    expect(await rejection(claimRequest(pending, id))).toBe("FORBIDDEN");
    expect(await rejection(claimRequest(rejected, id))).toBe("FORBIDDEN");
    expect(await rejection(claimRequest(client, id))).toBe("FORBIDDEN");
    expect(await rejection(claimRequest(null, id))).toBe("UNAUTHENTICATED");
    expect((await rowOf(id)).specialistId).toBeNull();
  });

  it("rejects an active specialist whose trade or area does not match", async () => {
    const id = await openPlumbing();

    expect(await rejection(claimRequest(electrician, id))).toBe("FORBIDDEN");
    expect(await rejection(claimRequest(farAwayPlumber, id))).toBe("FORBIDDEN");
    expect((await rowOf(id)).specialistId).toBeNull();
  });

  it("rejects a specialist without a profile", async () => {
    const bare = await createActor(UserRole.Specialist);
    const id = await openPlumbing();
    expect(await rejection(claimRequest(bare, id))).toBe("FORBIDDEN");
  });

  it("refuses an admin claiming a request", async () => {
    const id = await openPlumbing();
    expect(await rejection(claimRequest(admin, id))).toBe("FORBIDDEN");
  });

  it("reports an unknown request", async () => {
    expect(await rejection(claimRequest(plumber, 9999))).toBe("NOT_FOUND");
  });
});

describe("assignSpecialist", () => {
  it("lets an admin dispatch to any active specialist and flags it", async () => {
    const id = await openPlumbing();
    await recommendRequest(admin, id, otherPlumber.id);

    const assigned = await assignSpecialist(admin, id, electrician.id);

    expect(assigned).toMatchObject({
      specialistId: electrician.id,
      status: RequestStatus.Accepted,
      dispatchedByAdmin: true,
      recommendedSpecialistId: null,
    });
    expect((await eventsOf(id)).at(-1)).toEqual([
      "request.assigned",
      "CREATED",
      "ACCEPTED",
      admin.id,
    ]);
  });

  it("rejects non-admins", async () => {
    const id = await openPlumbing();
    expect(await rejection(assignSpecialist(plumber, id, plumber.id))).toBe(
      "FORBIDDEN",
    );
    expect(await rejection(assignSpecialist(client, id, plumber.id))).toBe(
      "FORBIDDEN",
    );
    expect(await rejection(assignSpecialist(pending, id, pending.id))).toBe(
      "FORBIDDEN",
    );
  });

  it("rejects inactive or non-specialist targets", async () => {
    const id = await openPlumbing();
    expect(await rejection(assignSpecialist(admin, id, pending.id))).toBe(
      "INVALID_INPUT",
    );
    expect(await rejection(assignSpecialist(admin, id, rejected.id))).toBe(
      "INVALID_INPUT",
    );
    expect(await rejection(assignSpecialist(admin, id, client.id))).toBe(
      "INVALID_INPUT",
    );
  });

  it("rejects an already assigned request", async () => {
    const id = await openPlumbing();
    await claimRequest(plumber, id);
    expect(await rejection(assignSpecialist(admin, id, otherPlumber.id))).toBe(
      "INVALID_STATE",
    );
  });
});

describe("recommendRequest", () => {
  it("stores the recommended specialist, the recommender and the time", async () => {
    const id = await openPlumbing();
    const before = Date.now();

    const dto = await recommendRequest(admin, id, plumber.id);

    expect(dto.recommendedSpecialistId).toBe(plumber.id);
    const row = await rowOf(id);
    expect(row.recommendedById).toBe(admin.id);
    expect(row.recommendedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(row.status).toBe(RequestStatus.Created);
    expect(await eventsOf(id)).toEqual([
      ["request.recommended", "CREATED", "CREATED", admin.id],
    ]);
  });

  it("rejects non-admins", async () => {
    const id = await openPlumbing();
    expect(
      await rejection(recommendRequest(plumber, id, otherPlumber.id)),
    ).toBe("FORBIDDEN");
    expect(await rejection(recommendRequest(client, id, plumber.id))).toBe(
      "FORBIDDEN",
    );
    expect(await rejection(recommendRequest(null, id, plumber.id))).toBe(
      "UNAUTHENTICATED",
    );
  });

  it("rejects inactive targets and assigned requests", async () => {
    const id = await openPlumbing();
    expect(await rejection(recommendRequest(admin, id, pending.id))).toBe(
      "INVALID_INPUT",
    );
    await claimRequest(plumber, id);
    expect(await rejection(recommendRequest(admin, id, otherPlumber.id))).toBe(
      "INVALID_STATE",
    );
  });
});

describe("declineRecommendation", () => {
  it("clears the recommendation and keeps the request open", async () => {
    const id = await openPlumbing();
    await recommendRequest(admin, id, plumber.id);

    const dto = await declineRecommendation(plumber, id);

    expect(dto.recommendedSpecialistId).toBeNull();
    expect(await rowOf(id)).toMatchObject({
      recommendedById: null,
      recommendedAt: null,
      status: RequestStatus.Created,
    });
    expect((await eventsOf(id)).at(-1)).toEqual([
      "request.recommendation_declined",
      "CREATED",
      "CREATED",
      plumber.id,
    ]);
  });

  it("rejects specialists the request was not recommended to", async () => {
    const id = await openPlumbing();
    await recommendRequest(admin, id, plumber.id);

    expect(await rejection(declineRecommendation(otherPlumber, id))).toBe(
      "FORBIDDEN",
    );
    expect(await rejection(declineRecommendation(client, id))).toBe(
      "FORBIDDEN",
    );
    expect((await rowOf(id)).recommendedSpecialistId).toBe(plumber.id);
  });

  it("rejects a request with no recommendation", async () => {
    const id = await openPlumbing();
    expect(await rejection(declineRecommendation(plumber, id))).toBe(
      "FORBIDDEN",
    );
  });
});
