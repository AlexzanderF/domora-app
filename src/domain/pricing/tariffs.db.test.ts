import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { outboxEvents, requireDb, tariffs } from "@/db";
import { UserRole } from "@/domain/identity/types";
import { createActor } from "../../../tests/db/factories";
import { defaultTariffs } from "./index";
import { createRequest } from "@/domain/requests";
import { findTariffs, saveTariffs } from "./tariffs";

describe("findTariffs (DB-backed)", () => {
  it("returns the default tariffs from an empty table", async () => {
    expect(await findTariffs()).toEqual(defaultTariffs);
  });

  it("returns the tariffs stored in the database", async () => {
    await requireDb()
      .insert(tariffs)
      .values([
        {
          category: "2",
          standardRate: 99,
        },
        {
          category: "home",
          standardRate: 20,
        },
      ]);

    const result = await findTariffs();
    expect(result.categories[2]).toBe(99);
    expect(result.categories[0]).toBe(defaultTariffs.categories[0]);
    expect(result.home).toBe(2);
  });
});

const newTariffs = {
  categories: { 0: 50, 1: 40, 2: 60, 3: 30, 4: 70, 5: 28 },
  home: 1.7,
  entry: 21,
  diagnosticFee: 30,
  volumeDiscountMinVisits: 3,
  volumeDiscountPercent: 20,
};

async function code(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (error: { code?: string }) => error.code ?? "UNKNOWN",
  );
}

describe("saveTariffs", () => {
  it("refuses non-Administrators and changes nothing", async () => {
    const client = await createActor(UserRole.Client);
    const specialist = await createActor(UserRole.Specialist);

    expect(await code(saveTariffs(client, newTariffs))).toBe("FORBIDDEN");
    expect(await code(saveTariffs(specialist, newTariffs))).toBe("FORBIDDEN");
    expect(await code(saveTariffs(null, newTariffs))).toBe("UNAUTHENTICATED");
    expect(await findTariffs()).toEqual(defaultTariffs);
    expect(await requireDb().select().from(outboxEvents)).toHaveLength(0);
  });

  it("round-trips every rate exactly, including the Home rate", async () => {
    const admin = await createActor(UserRole.Admin);

    await saveTariffs(admin, newTariffs);

    expect(await findTariffs()).toEqual(newTariffs);
    const [home] = await requireDb()
      .select()
      .from(tariffs)
      .where(eq(tariffs.category, "home"));
    expect(home.standardRate).toBe(17);
  });

  it("round-trips a Home rate of 2 lev (no threshold guessing)", async () => {
    const admin = await createActor(UserRole.Admin);

    await saveTariffs(admin, { ...newTariffs, home: 2 });

    expect((await findTariffs()).home).toBe(2);
  });

  it("writes a tariffs.updated outbox event with the saved rates", async () => {
    const admin = await createActor(UserRole.Admin);

    await saveTariffs(admin, newTariffs);

    const events = await requireDb().select().from(outboxEvents);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("tariffs.updated");
    expect(events[0].payload).toMatchObject({ actorId: admin.id });
  });

  it("rejects invalid rates without writing", async () => {
    const admin = await createActor(UserRole.Admin);

    expect(await code(saveTariffs(admin, { ...newTariffs, entry: 0 }))).toBe(
      "INVALID_INPUT",
    );
    expect(await findTariffs()).toEqual(defaultTariffs);
    expect(await requireDb().select().from(outboxEvents)).toHaveLength(0);
  });
});

describe("pricing settings", () => {
  it("defaults to a 25 diagnostic fee and a 10% discount from 4 visits", async () => {
    const result = await findTariffs();
    expect(result.diagnosticFee).toBe(25);
    expect(result.volumeDiscountMinVisits).toBe(4);
    expect(result.volumeDiscountPercent).toBe(10);
  });

  it("saves the settings and re-saving updates the single row", async () => {
    const admin = await createActor(UserRole.Admin);

    await saveTariffs(admin, newTariffs);
    await saveTariffs(admin, { ...newTariffs, diagnosticFee: 33 });

    const saved = await findTariffs();
    expect(saved).toEqual({ ...newTariffs, diagnosticFee: 33 });
  });

  it("rejects out-of-range settings without writing", async () => {
    const admin = await createActor(UserRole.Admin);

    for (const override of [
      { diagnosticFee: 0 },
      { volumeDiscountMinVisits: 9 },
      { volumeDiscountPercent: 101 },
      { volumeDiscountPercent: 10.5 },
    ]) {
      expect(
        await code(saveTariffs(admin, { ...newTariffs, ...override })),
      ).toBe("INVALID_INPUT");
    }
    expect(await findTariffs()).toEqual(defaultTariffs);
  });

  it("applies a changed diagnostic fee to a new booking's price", async () => {
    const admin = await createActor(UserRole.Admin);
    const client = await createActor(UserRole.Client);
    const booking = {
      category: 2 as const,
      serviceIndex: 1,
      service: "Оглед",
      description: "Оглед на проблема",
      address: "София, ул. Тест 1",
      scheduledDate: "2030-05-17",
      scheduledTime: "09:00 - 12:00",
    };

    await saveTariffs(admin, newTariffs);

    expect(
      await code(createRequest(client, { ...booking, expectedPrice: 25 })),
    ).toBe("PRICE_CHANGED");
    const created = await createRequest(client, {
      ...booking,
      expectedPrice: 30,
    });
    expect(created.price).toBe(30);
  });
});
