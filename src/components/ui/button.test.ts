import { describe, expect, it } from "vitest";

import { buttonVariants } from "./button";

describe("buttonVariants touch targets", () => {
  it("is at least 44px tall below lg by default", () => {
    expect(buttonVariants()).toContain("min-h-11");
  });

  it("only goes compact from lg", () => {
    const compact = buttonVariants({ size: "compact" });
    expect(compact).toContain("min-h-11");
    expect(compact).toContain("lg:min-h-9");
  });

  it("makes icon buttons 44x44", () => {
    expect(buttonVariants({ size: "icon" })).toContain("size-11");
  });

  it("keeps link buttons at 44px below lg", () => {
    const link = buttonVariants({ variant: "link" });
    expect(link).toContain("min-h-11");
    expect(link).toContain("lg:min-h-0");
  });
});
