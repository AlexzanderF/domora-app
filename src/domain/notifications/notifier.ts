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
// stage. A real driver is chosen by NOTIFIER_DRIVER once one exists.
const consoleNotifier: Notifier = {
  async send({ to, template, data }) {
    const { subject, text } = renderTemplate(template, data);
    console.log(`[notifier:console] to=${to} subject="${subject}"\n${text}`);
  },
};

export function createNotifier(driver: string | undefined): Notifier {
  if (driver === undefined || driver === "" || driver === "console") {
    return consoleNotifier;
  }
  throw new Error(`Unknown NOTIFIER_DRIVER "${driver}".`);
}
