import { describe, expect, it } from "vitest";
import { requireDb, tariffs } from "@/db";
import { defaultTariffs } from "./index";
import { findTariffs } from "./tariffs";

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
          urgentRate: 1,
          holidayRate: 1,
          emergencyRate: 1,
        },
        {
          category: "home",
          standardRate: 20,
          urgentRate: 1,
          holidayRate: 1,
          emergencyRate: 1,
        },
      ]);

    const result = await findTariffs();
    expect(result.categories[2]).toBe(99);
    expect(result.categories[0]).toBe(defaultTariffs.categories[0]);
    expect(result.home).toBe(20);
  });
});
