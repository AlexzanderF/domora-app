import { describe, expect, it } from "vitest";
import { hasUnsavedReport } from "./report-draft";

describe("hasUnsavedReport", () => {
  it("is false for an empty draft", () => {
    expect(hasUnsavedReport("", 0)).toBe(false);
  });

  it("ignores whitespace-only text", () => {
    expect(hasUnsavedReport("  \n ", 0)).toBe(false);
  });

  it("is true when text was typed", () => {
    expect(hasUnsavedReport("Сменен сифон", 0)).toBe(true);
  });

  it("is true when photos were added", () => {
    expect(hasUnsavedReport("", 2)).toBe(true);
  });
});
