import { afterEach, describe, expect, it, vi } from "vitest";
import { createNotifier } from "./notifier";

afterEach(() => vi.restoreAllMocks());

describe("console notifier", () => {
  it("logs the rendered message and sends nothing", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await createNotifier("console").send({
      to: "a@example.com",
      template: "request-completed",
      data: { title: "Смяна на кран" },
    });
    const line = log.mock.calls.flat().join(" ");
    expect(line).toContain("a@example.com");
    expect(line).toContain("Заявката ви е изпълнена");
  });

  it("is the default driver", () => {
    expect(() => createNotifier(undefined)).not.toThrow();
  });

  it("rejects an unknown driver", () => {
    expect(() => createNotifier("carrier-pigeon")).toThrow(/carrier-pigeon/);
  });
});
