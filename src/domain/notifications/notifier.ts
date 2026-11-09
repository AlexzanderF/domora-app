import { renderTemplate } from "./templates";

export interface NotificationMessage {
  to: string;
  template: string;
  data: Record<string, unknown>;
}

export interface Notifier {
  send(message: NotificationMessage): Promise<void>;
}

// Logs what would be sent and sends nothing: dev, tests and the HTTP-on-IP
// stage. It is the default; other drivers are chosen by NOTIFIER_DRIVER.
const consoleNotifier: Notifier = {
  async send({ to, template, data }) {
    const { subject, text } = renderTemplate(template, data);
    console.log(`[notifier:console] to=${to} subject="${subject}"\n${text}`);
  },
};

export interface NotifierOptions {
  apiKey?: string;
  from?: string;
  fetch?: typeof fetch;
}

const RESEND_URL = "https://api.resend.com/emails";

// Plain HTTP, no SDK. Any failure throws so the outbox retry logic sees it.
function createResendNotifier({
  apiKey,
  from,
  fetch: fetchImpl = fetch,
}: NotifierOptions): Notifier {
  if (!apiKey) throw new Error("RESEND_API_KEY is required for resend.");
  if (!from) throw new Error("NOTIFIER_FROM is required for resend.");
  return {
    async send({ to, template, data }) {
      const { subject, text, html } = renderTemplate(template, data);
      const response = await fetchImpl(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [to], subject, text, html }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Resend responded ${response.status}: ${detail}`);
      }
    },
  };
}

export function createNotifier(
  driver: string | undefined,
  options: NotifierOptions = {},
): Notifier {
  if (driver === undefined || driver === "" || driver === "console") {
    return consoleNotifier;
  }
  if (driver === "resend") return createResendNotifier(options);
  throw new Error(`Unknown NOTIFIER_DRIVER "${driver}".`);
}
