import { and, eq } from "drizzle-orm";
import { specialistProfiles, users } from "@/db";
import { matchesProfile } from "@/domain/dispatch";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { RequestPriority } from "@/domain/requests/types";
import type { EventHandler, EventHandlers, Tx } from "./index";
import type { NotificationMessage } from "./notifier";
import { adminEmails, emailOf, loadRequest, payloadOf } from "./recipients";

// Who hears about each step of a request. Recipients are resolved when the
// worker fans the event out, from the outbox payload plus current rows.

// STANDARD requests wait in the queue without paging admins.
const ADMIN_ALERT_PRIORITIES: string[] = [
  RequestPriority.Urgent,
  RequestPriority.Emergency,
  RequestPriority.Holiday,
];

async function toClient(
  template: string,
  tx: Tx,
  payload: Record<string, unknown>,
): Promise<NotificationMessage[]> {
  const request = await loadRequest(tx, payload);
  if (!request) return [];
  const to = await emailOf(tx, request.clientId);
  return to ? [{ to, template, data: { title: request.title } }] : [];
}

const onCreated: EventHandler = async (event, tx) => {
  const request = await loadRequest(tx, payloadOf(event));
  // Taken or cancelled before the worker got here: nothing left to offer.
  if (!request || request.cancelled || request.specialistId !== null) return [];

  const data = {
    title: request.title,
    address: request.address,
    priority: request.priority,
  };
  const messages: NotificationMessage[] = [];

  const specialists = await tx
    .select({
      email: users.email,
      category: specialistProfiles.category,
      area: specialistProfiles.area,
    })
    .from(users)
    .innerJoin(specialistProfiles, eq(specialistProfiles.userId, users.id))
    .where(
      and(
        eq(users.role, UserRole.Specialist),
        eq(users.status, UserStatus.Active),
      ),
    );
  for (const specialist of specialists) {
    if (matchesProfile(request, specialist)) {
      messages.push({
        to: specialist.email,
        template: "new-opportunity",
        data,
      });
    }
  }

  if (ADMIN_ALERT_PRIORITIES.includes(request.priority)) {
    for (const to of await adminEmails(tx)) {
      messages.push({ to, template: "urgent-unassigned", data });
    }
  }
  return messages;
};

const onRecommended: EventHandler = async (event, tx) => {
  const payload = payloadOf(event);
  const request = await loadRequest(tx, payload);
  const to = await emailOf(tx, Number(payload.specialistId));
  if (!request || !to) return [];
  return [
    {
      to,
      template: "request-recommended",
      data: { title: request.title, address: request.address },
    },
  ];
};

export const requestFlowHandlers: EventHandlers = {
  "request.created": onCreated,
  "request.accepted": (event, tx) =>
    toClient("request-accepted", tx, payloadOf(event)),
  "request.report_submitted": (event, tx) =>
    toClient("report-submitted", tx, payloadOf(event)),
  "request.recommended": onRecommended,
};
