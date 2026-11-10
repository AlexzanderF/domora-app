import { describe, expect, it, vi } from "vitest";

import { guardedOpenChange } from "./dialog-guard";

describe("guardedOpenChange", () => {
  it("passes opening straight through", async () => {
    const onOpenChange = vi.fn();
    const confirmClose = vi.fn();
    await guardedOpenChange(true, onOpenChange, confirmClose);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(confirmClose).not.toHaveBeenCalled();
  });

  it("closes without asking when no hook is given", async () => {
    const onOpenChange = vi.fn();
    await guardedOpenChange(false, onOpenChange);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when the hook confirms", async () => {
    const onOpenChange = vi.fn();
    await guardedOpenChange(false, onOpenChange, () => Promise.resolve(true));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stays open when the hook declines", async () => {
    const onOpenChange = vi.fn();
    await guardedOpenChange(false, onOpenChange, () => false);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
