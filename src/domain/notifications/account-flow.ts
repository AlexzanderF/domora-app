import { eq } from "drizzle-orm";
import { requestDisputes } from "@/db";
import type { EventHandler, EventHandlers } from "./index";
import type { NotificationMessage } from "./notifier";
import {
  adminEmails,
  emailOf,
  loadRequest,
  nameOf,
  payloadOf,
} from "./recipients";

// Who hears about accounts and disputes. Like request-flow, recipients are
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

const onDisputeRaised: EventHandler = async (event, tx) => {
  const request = await loadRequest(tx, payloadOf(event));
  if (!request) return [];
  const [dispute] = await tx
    .select({ note: requestDisputes.note })
    .from(requestDisputes)
    .where(eq(requestDisputes.id, Number(payloadOf(event).disputeId)));
  const data = { title: request.title, note: dispute?.note ?? "" };
  const recipients = await adminEmails(tx);
  if (request.specialistId !== null) {
    const specialist = await emailOf(tx, request.specialistId);
    if (specialist) recipients.unshift(specialist);
  }
  return recipients.map((to) => ({ to, template: "dispute-raised", data }));
};

const onDisputeResolved: EventHandler = async (event, tx) => {
  const request = await loadRequest(tx, payloadOf(event));
  if (!request) return [];
  const data = {
    title: request.title,
    note: String(payloadOf(event).resolutionNote ?? ""),
  };
  const ids = [request.clientId, request.specialistId];
  const messages: NotificationMessage[] = [];
  for (const id of ids) {
    const to = id === null ? undefined : await emailOf(tx, id);
    if (to) messages.push({ to, template: "dispute-resolved", data });
  }
  return messages;
};

export const accountFlowHandlers: EventHandlers = {
  "specialist.registered": onRegistered,
  "specialist.approved": toSpecialist("specialist-approved"),
  "specialist.rejected": toSpecialist("specialist-rejected"),
  "password.reset_requested": onPasswordResetRequested,
  "request.dispute_raised": onDisputeRaised,
  "request.dispute_resolved": onDisputeResolved,
};
