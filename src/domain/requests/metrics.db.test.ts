import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { requireDb, requests } from "@/db";
import type { Actor } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { RequestPriority, RequestStatus } from "@/domain/requests/types";
import { createActor, insertRequest } from "../../../tests/db/factories";
import { requestMetrics } from "./metrics";

let admin: Actor;
let client: Actor;

beforeEach(async () => {
  admin = await createActor(UserRole.Admin);
  client = await createActor(UserRole.Client);
});

describe("requestMetrics", () => {
  it("starts from zero", async () => {
    expect(await requestMetrics(admin)).toEqual({
      unassignedUrgentCount: 0,
      pendingSpecialistsCount: 0,
      activeRepairsCount: 0,
      monthlyRevenue: 0,
    });
  });

  it("refuses non-administrators", async () => {
    await expect(requestMetrics(client)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(requestMetrics(null)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("counts unassigned urgent requests, excluding cancelled and assigned ones", async () => {
    const specialist = await createActor(UserRole.Specialist);
    const clientId = client.id;
    await insertRequest({ clientId, priority: RequestPriority.Urgent });
    await insertRequest({ clientId, priority: RequestPriority.Emergency });
    await insertRequest({ clientId, priority: RequestPriority.Standard });
    await insertRequest({
      clientId,
      priority: RequestPriority.Urgent,
      cancelled: true,
    });
    await insertRequest({
      clientId,
      priority: RequestPriority.Urgent,
      status: RequestStatus.Accepted,
      specialistId: specialist.id,
    });

    expect((await requestMetrics(admin)).unassignedUrgentCount).toBe(2);
  });

  it("counts active stages, excluding cancelled requests", async () => {
    const clientId = client.id;
    for (const status of [
      RequestStatus.Accepted,
      RequestStatus.InProgress,
      RequestStatus.AwaitingConfirmation,
    ]) {
      await insertRequest({ clientId, status });
    }
    await insertRequest({
      clientId,
      status: RequestStatus.InProgress,
      cancelled: true,
    });
    await insertRequest({ clientId, status: RequestStatus.Completed });

    expect((await requestMetrics(admin)).activeRepairsCount).toBe(3);
  });

  it("counts pending specialists", async () => {
    await createActor(UserRole.Specialist, UserStatus.Pending);
    await createActor(UserRole.Specialist, UserStatus.Active);

    expect((await requestMetrics(admin)).pendingSpecialistsCount).toBe(1);
  });

  it("sums this month's revenue by completion time", async () => {
    const clientId = client.id;
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const completed = { clientId, status: RequestStatus.Completed };
    await insertRequest({ ...completed, price: 100, completedAt: now });
    // Created last month but completed this month: counts.
    const old = await insertRequest({
      ...completed,
      price: 50,
      completedAt: now,
    });
    await requireDb()
      .update(requests)
      .set({ createdAt: lastMonth })
      .where(eq(requests.id, old));
    // Completed last month but touched this month: does not count.
    await insertRequest({ ...completed, price: 999, completedAt: lastMonth });

    expect((await requestMetrics(admin)).monthlyRevenue).toBe(150);
  });
});
