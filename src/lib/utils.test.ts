import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins conditional classes and lets later Tailwind classes win", () => {
    expect(cn("p-2 text-sm", false && "hidden", "p-4")).toBe("text-sm p-4");
  });
});
