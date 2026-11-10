import { describe, expect, it } from "vitest";
import { Plan } from "@/domain/requests/types";
import {
  calculateQuote,
  defaultTariffs as initialTariffs,
  quoteScope,
  tariffsFromRows,
} from "./index";

describe("booking prices", () => {
  it("uses category tariffs for the first service and the fixed diagnostic price for the second", () => {
    expect(calculateQuote(initialTariffs, 0, 0)).toBe(45);
    expect(calculateQuote(initialTariffs, 2, 0)).toBe(55);
    expect(calculateQuote(initialTariffs, 2, 1)).toBe(25);
  });

  it.each([
    { visits: 1, expected: 120 },
    { visits: 2, expected: 240 },
    { visits: 4, expected: 432 },
    { visits: 8, expected: 864 },
  ])(
    "prices an 80 m² home for $visits monthly visits",
    ({ visits, expected }) => {
      expect(calculateQuote(initialTariffs, 4, 0, Plan.Home, 80, visits)).toBe(
        expected,
      );
    },
  );

  it("prices entry subscriptions by floor count and rounds the discounted total", () => {
    expect(calculateQuote(initialTariffs, 4, 0, Plan.Entry, 6, 2)).toBe(216);
    expect(calculateQuote(initialTariffs, 4, 0, Plan.Entry, 7, 4)).toBe(454);
  });

  it.each([0, -1, 1001, NaN, Infinity])(
    "rejects invalid subscription quantity %s",
    (quantity) => {
      expect(() =>
        calculateQuote(initialTariffs, 4, 0, Plan.Home, quantity),
      ).toThrow();
    },
  );

  it.each([0, -1, 9, 1.5, NaN, Infinity])(
    "rejects invalid monthly visit count %s",
    (visitsPerMonth) => {
      expect(() =>
        calculateQuote(initialTariffs, 4, 0, Plan.Home, 80, visitsPerMonth),
      ).toThrow();
    },
  );

  it("identifies inspection-only categories even for their first service", () => {
    expect(quoteScope(3, 0)).toContain("оглед / диагностика");
    expect(quoteScope(5, 0)).toContain("оглед / диагностика");
    expect(quoteScope(0, 0)).toContain("Труд");
  });
});

describe("tariffsFromRows", () => {
  const row = (category: string, standardRate: number) => ({
    category,
    standardRate,
  });

  it("falls back to the default tariffs when there are no rows", () => {
    expect(tariffsFromRows([])).toEqual(initialTariffs);
  });

  it("maps category, home and entry rows over the defaults", () => {
    const tariffs = tariffsFromRows([
      row("0", 50),
      row("4", 70),
      row("home", 20),
      row("entry", 22),
    ]);
    expect(tariffs.categories).toEqual({
      ...initialTariffs.categories,
      0: 50,
      4: 70,
    });
    expect(tariffs.home).toBe(2);
    expect(tariffs.entry).toBe(22);
  });

  it("reads the home rate stored in tenths of a lev", () => {
    expect(tariffsFromRows([row("home", 25)]).home).toBe(2.5);
  });

  it("ignores unknown categories", () => {
    expect(tariffsFromRows([row("9", 1), row("other", 1)])).toEqual(
      initialTariffs,
    );
  });
});

describe("calculateQuote with pricing settings", () => {
  const custom = {
    ...initialTariffs,
    diagnosticFee: 40,
    volumeDiscountMinVisits: 2,
    volumeDiscountPercent: 50,
  };

  it("uses the configured diagnostic fee", () => {
    expect(calculateQuote(custom, 2, 1)).toBe(40);
  });

  it("applies the configured discount from the configured visit count", () => {
    expect(calculateQuote(custom, 4, 0, Plan.Entry, 10, 1)).toBe(180);
    expect(calculateQuote(custom, 4, 0, Plan.Entry, 10, 2)).toBe(180);
  });
});
