import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast, Toaster: () => null }));

import { notify } from "./toast-provider";

describe("notify (behind useToast)", () => {
  beforeEach(() => toast.mockReset());

  it("shows the message as a status announcement", () => {
    notify("Заявката е създадена.");

    expect(toast).toHaveBeenCalledTimes(1);
    const [content] = toast.mock.calls[0];
    const html = renderToStaticMarkup(content);
    expect(html).toContain('role="status"');
    expect(html).toContain("Заявката е създадена.");
  });

  it("replaces the visible toast instead of stacking a new one", () => {
    notify("Първо");
    notify("Второ");

    const ids = toast.mock.calls.map(([, options]) => options.id);
    expect(ids[0]).toBeDefined();
    expect(ids[1]).toBe(ids[0]);
  });
});
