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

describe("resend notifier", () => {
  const message = {
    to: "a@example.com",
    template: "request-completed",
    data: { title: "Смяна на кран" },
  };
  const config = { apiKey: "re_test", from: "DOMORA <no-reply@example.com>" };

  it("posts the rendered message to Resend over HTTP", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    await createNotifier("resend", { ...config, fetch: fetchMock }).send(
      message,
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer re_test",
    );
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      from: config.from,
      to: ["a@example.com"],
      subject: "Заявката ви е изпълнена",
    });
    expect(body.html).toContain("Смяна на кран");
    expect(body.text).toContain("Смяна на кран");
  });

  it("throws on a non-2xx response so the retry logic sees the failure", async () => {
    const fetchMock = vi.fn(
      async () => new Response("domain not verified", { status: 403 }),
    );
    await expect(
      createNotifier("resend", { ...config, fetch: fetchMock }).send(message),
    ).rejects.toThrow(/403/);
  });

  it("throws when the request itself fails", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("network down");
    });
    await expect(
      createNotifier("resend", { ...config, fetch: fetchMock }).send(message),
    ).rejects.toThrow(/network down/);
  });

  it("refuses to start without an API key or sender", () => {
    expect(() => createNotifier("resend", { from: config.from })).toThrow(
      /RESEND_API_KEY/,
    );
    expect(() => createNotifier("resend", { apiKey: "k" })).toThrow(
      /NOTIFIER_FROM/,
    );
  });
});
