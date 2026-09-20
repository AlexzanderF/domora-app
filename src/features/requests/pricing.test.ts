import { describe, expect, it } from "vitest";
import { initialTariffs } from "./demo-data";
import { calculateQuote, quoteScope } from "./pricing";

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
      expect(calculateQuote(initialTariffs, 4, 0, "home", 80, visits)).toBe(
        expected,
      );
    },
  );

  it("prices entry subscriptions by floor count and rounds the discounted total", () => {
    expect(calculateQuote(initialTariffs, 4, 0, "entry", 6, 2)).toBe(216);
    expect(calculateQuote(initialTariffs, 4, 0, "entry", 7, 4)).toBe(454);
  });

  it.each([0, -1, 1001, NaN, Infinity])(
    "rejects invalid subscription quantity %s",
    (quantity) => {
      expect(() =>
        calculateQuote(initialTariffs, 4, 0, "home", quantity),
      ).toThrow();
    },
  );

  it.each([0, -1, 9, 1.5, NaN, Infinity])(
    "rejects invalid monthly visit count %s",
    (visitsPerMonth) => {
      expect(() =>
        calculateQuote(initialTariffs, 4, 0, "home", 80, visitsPerMonth),
      ).toThrow();
    },
  );

  it("identifies inspection-only categories even for their first service", () => {
    expect(quoteScope(3, 0)).toContain("оглед / диагностика");
    expect(quoteScope(5, 0)).toContain("оглед / диагностика");
    expect(quoteScope(0, 0)).toContain("Труд");
  });
});
