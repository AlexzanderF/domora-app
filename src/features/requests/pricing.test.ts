import { describe, expect, it } from "vitest";
import { initialTariffs } from "./demo-data";
import { calculateQuote, quoteScope } from "./pricing";

describe("booking prices", () => {
  it("uses category tariffs for the first service and the fixed diagnostic price for the second", () => {
    expect(calculateQuote(initialTariffs, 0, 0)).toBe(45);
    expect(calculateQuote(initialTariffs, 2, 0)).toBe(55);
    expect(calculateQuote(initialTariffs, 2, 1)).toBe(25);
  });

  it("prices the two subscription types independently and rounds to whole euros", () => {
    expect(calculateQuote(initialTariffs, 4, 0, "home", 80)).toBe(120);
    expect(calculateQuote(initialTariffs, 4, 0, "home", 81)).toBe(122);
    expect(calculateQuote(initialTariffs, 4, 0, "entry", 6)).toBe(108);
  });

  it.each([0, -1, 1001, NaN, Infinity])(
    "rejects invalid subscription quantity %s",
    (quantity) => {
      expect(() =>
        calculateQuote(initialTariffs, 4, 0, "home", quantity),
      ).toThrow();
    },
  );

  it("identifies inspection-only categories even for their first service", () => {
    expect(quoteScope(3, 0)).toContain("оглед / диагностика");
    expect(quoteScope(5, 0)).toContain("оглед / диагностика");
    expect(quoteScope(0, 0)).toContain("Труд");
  });
});
