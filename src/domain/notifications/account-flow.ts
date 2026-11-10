import type { EventHandler, EventHandlers } from "./index";
import { adminEmails, emailOf, nameOf, payloadOf } from "./recipients";

// Who hears about accounts. Like request-flow, recipients are
// resolved when the worker fans the event out.

// Links in emails need the public address of the app; the worker has no
// request to read it from.
function appUrl(): string {
  const url = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL is required to email links.");
  }
  return "http://localhost:3000";
}

const onRegistered: EventHandler = async (event, tx) => {
  const name = await nameOf(tx, Number(payloadOf(event).userId));
  if (!name) return [];
  return (await adminEmails(tx)).map((to) => ({
    to,
    template: "specialist-registered",
    data: { name },
  }));
};

function toSpecialist(template: string): EventHandler {
  return async (event, tx) => {
    const userId = Number(payloadOf(event).userId);
    const [to, name] = await Promise.all([
      emailOf(tx, userId),
      nameOf(tx, userId),
    ]);
    return to ? [{ to, template, data: { name } }] : [];
  };
}

const onPasswordResetRequested: EventHandler = async (event, tx) => {
  const { userId, secrets } = payloadOf(event) as {
    userId: number;
    secrets: { token: string };
  };
  const [to, name] = await Promise.all([
    emailOf(tx, userId),
    nameOf(tx, userId),
  ]);
  if (!to) return [];
  const url = `${appUrl()}/reset-password?token=${secrets.token}`;
  return [{ to, template: "password-reset", data: { name, secrets: { url } } }];
};

export const accountFlowHandlers: EventHandlers = {
  "specialist.registered": onRegistered,
  "specialist.approved": toSpecialist("specialist-approved"),
  "specialist.rejected": toSpecialist("specialist-rejected"),
  "password.reset_requested": onPasswordResetRequested,
};
