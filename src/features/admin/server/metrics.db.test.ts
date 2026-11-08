import { describe, expect, it } from "vitest";
import { requireDb, requests, users } from "@/db";
import { findAdminKpiMetrics } from "./metrics";

describe("findAdminKpiMetrics (DB-backed)", () => {
  it("counts unassigned urgent requests and pending specialists from persisted rows", async () => {
    const db = requireDb();
    const [client, specialist] = await db
      .insert(users)
      .values([
        {
          name: "Клиент",
          email: "c@test.bg",
          phone: "0888000001",
          passwordHash: "x",
          role: "CLIENT",
        },
        {
          name: "Майстор",
          email: "s@test.bg",
          phone: "0888000002",
          passwordHash: "x",
          role: "SPECIALIST",
          status: "PENDING",
        },
      ])
      .returning();
    await db.insert(requests).values({
      clientId: client.id,
      title: "Теч",
      description: "Тече кран",
      category: "ВиК",
      address: "София",
      priority: "URGENT",
      price: 100,
      clientPhone: client.phone,
    });

    const metrics = await findAdminKpiMetrics();

    expect(specialist.status).toBe("PENDING");
    expect(metrics).toMatchObject({
      unassignedUrgentCount: 1,
      pendingSpecialistsCount: 1,
    });
  });

  it("starts each test from a clean database", async () => {
    const metrics = await findAdminKpiMetrics();

    expect(metrics).toMatchObject({
      unassignedUrgentCount: 0,
      pendingSpecialistsCount: 0,
    });
  });
});
