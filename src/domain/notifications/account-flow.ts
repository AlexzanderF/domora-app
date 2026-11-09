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

// Who hears about specialist accounts and disputes. Like request-flow,
// recipients are resolved when the worker fans the event out.

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
  "request.dispute_raised": onDisputeRaised,
  "request.dispute_resolved": onDisputeResolved,
};
