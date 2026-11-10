import { describe, expect, it } from "vitest";
import { TIME_RANGES, isPastDate } from "./schedule";

describe("isPastDate", () => {
  it("rejects days before today", () => {
    expect(isPastDate("2026-11-09", "2026-11-10")).toBe(true);
  });
  it("accepts today and later", () => {
    expect(isPastDate("2026-11-10", "2026-11-10")).toBe(false);
    expect(isPastDate("2026-12-01", "2026-11-10")).toBe(false);
  });
});

describe("TIME_RANGES", () => {
  it("offers the three booking ranges", () => {
    expect(TIME_RANGES).toEqual(["09:00–12:00", "12:00–15:00", "15:00–18:00"]);
  });
});
