import { describe, expect, it } from "vitest";
import { requireDb, requests, users } from "@/db";
import { findAdminKpiMetrics } from "./metrics";

describe("findAdminKpiMetrics (DB-backed)", () => {
  it("reports persisted state, and starts from an empty database", async () => {
    expect(await findAdminKpiMetrics()).toMatchObject({
      unassignedUrgentCount: 0,
      pendingSpecialistsCount: 0,
    });

    const db = requireDb();
    const [client] = await db
      .insert(users)
      .values([
        {
          name: "Клиент",
          email: "client@test.bg",
          phone: "0888000001",
          passwordHash: "not-a-real-hash",
          role: "CLIENT",
        },
        {
          name: "Майстор",
          email: "specialist@test.bg",
          phone: "0888000002",
          passwordHash: "not-a-real-hash",
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

    expect(await findAdminKpiMetrics()).toMatchObject({
      unassignedUrgentCount: 1,
      pendingSpecialistsCount: 1,
    });
  });
});
