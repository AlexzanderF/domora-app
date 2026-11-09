import { and, eq } from "drizzle-orm";
import { requests, specialistProfiles, users } from "@/db";
import { matchesProfile } from "@/domain/dispatch";
import { UserRole, UserStatus } from "@/features/auth/types";
import { RequestPriority } from "@/features/requests/types";
import type { EventHandler, EventHandlers, Tx } from "./index";
import type { NotificationMessage } from "./notifier";

// Who hears about each step of a request. Recipients are resolved when the
// worker fans the event out, from the outbox payload plus current rows.

// STANDARD requests wait in the queue without paging admins.
const ADMIN_ALERT_PRIORITIES: string[] = [
  RequestPriority.Urgent,
  RequestPriority.Emergency,
  RequestPriority.Holiday,
];

async function loadRequest(tx: Tx, payload: Record<string, unknown>) {
  const [row] = await tx
    .select()
    .from(requests)
    .where(eq(requests.id, Number(payload.requestId)));
  return row;
}

async function emailOf(tx: Tx, userId: number): Promise<string | undefined> {
  const [row] = await tx
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  return row?.email;
}

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
  const request = await loadRequest(
    tx,
    event.payload as Record<string, unknown>,
  );
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
    const admins = await tx
      .select({ email: users.email })
      .from(users)
      .where(
        and(
          eq(users.role, UserRole.Admin),
          eq(users.status, UserStatus.Active),
        ),
      );
    for (const admin of admins) {
      messages.push({ to: admin.email, template: "urgent-unassigned", data });
    }
  }
  return messages;
};

const onRecommended: EventHandler = async (event, tx) => {
  const payload = event.payload as Record<string, unknown>;
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
    toClient("request-accepted", tx, event.payload as Record<string, unknown>),
  "request.report_submitted": (event, tx) =>
    toClient("report-submitted", tx, event.payload as Record<string, unknown>),
  "request.recommended": onRecommended,
};
