import { and, desc, eq, isNull } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requests, requireDb, users } from "@/db";
import { can } from "@/domain/authorization";
import type { Actor } from "@/domain/authorization";
import { UserRole } from "@/domain/identity/types";
import { listReportPhotoIds } from "@/domain/photos";
import { withActions } from "./actions";
import type { ActionKind } from "./actions";
import { toDto } from "./dto";
import type { RequestDto } from "./dto";
import { forbidden, requireActor } from "./errors";
import { RequestPriority, RequestStatus } from "./types";

// Framework-free (no next/*): the Service Request read side. Actor-first
// named read functions over one visibility rule and one row mapper.

export interface ClientRequest extends RequestDto {
  specialistName: string | null;
  specialistPhone: string | null;
  reportPhotoIds: number[];
  // What the viewing actor may do with this request right now.
  actions: ActionKind[];
}

// The client's own requests, newest first.
export async function listClientRequests(
  actorOrNull: Actor | null,
): Promise<ClientRequest[]> {
  const actor = requireActor(actorOrNull);
  if (actor.role !== UserRole.Client) forbidden();

  const rows = await requireDb()
    .select({ request: requests, specialist: users })
    .from(requests)
    .leftJoin(users, eq(requests.specialistId, users.id))
    .where(eq(requests.clientId, actor.id))
    .orderBy(desc(requests.createdAt), desc(requests.id));
  const photos = await listReportPhotoIds(rows.map((r) => r.request.id));

  return rows.map(({ request, specialist }) =>
    withActions(
      actor,
      {
        ...toDto(request),
        specialistName: specialist?.name ?? null,
        specialistPhone: specialist?.phone ?? null,
        reportPhotoIds: photos.get(request.id) ?? [],
      },
      request,
    ),
  );
}

// An admin list row: the client's request plus who the client is.
export interface AdminRequest extends ClientRequest {
  clientName: string | null;
}

async function readAdminRows(
  actor: Actor,
  where: SQL | undefined,
  order: SQL[],
): Promise<AdminRequest[]> {
  const specialists = alias(users, "specialists");
  const clients = alias(users, "clients");
  const rows = await requireDb()
    .select({ request: requests, specialist: specialists, client: clients })
    .from(requests)
    .leftJoin(specialists, eq(requests.specialistId, specialists.id))
    .leftJoin(clients, eq(requests.clientId, clients.id))
    .where(where)
    .orderBy(...order);
  const photos = await listReportPhotoIds(rows.map((r) => r.request.id));

  return rows.map(({ request, specialist, client }) =>
    withActions(
      actor,
      {
        ...toDto(request),
        specialistName: specialist?.name ?? null,
        specialistPhone: specialist?.phone ?? null,
        clientName: client?.name ?? null,
        reportPhotoIds: photos.get(request.id) ?? [],
      },
      request,
    ),
  );
}

function requireAdminReader(actorOrNull: Actor | null): Actor {
  const actor = requireActor(actorOrNull);
  if (!can(actor, "request.list_all")) forbidden();
  return actor;
}

const isUrgent = (priority: RequestPriority) =>
  priority === RequestPriority.Urgent || priority === RequestPriority.Emergency;

// Every request, newest first.
export async function listAll(
  actorOrNull: Actor | null,
): Promise<AdminRequest[]> {
  const actor = requireAdminReader(actorOrNull);
  return readAdminRows(actor, undefined, [
    desc(requests.createdAt),
    desc(requests.id),
  ]);
}

// The Triage Queues: claimable requests (urgent first, then newest), or
// requests with an open Dispute (most recently touched first).
export async function listTriage(
  actorOrNull: Actor | null,
  queue: "unassigned" | "disputed",
): Promise<AdminRequest[]> {
  const actor = requireAdminReader(actorOrNull);
  if (queue === "disputed") {
    return readAdminRows(actor, eq(requests.issue, true), [
      desc(requests.updatedAt),
      desc(requests.id),
    ]);
  }
  const rows = await readAdminRows(
    actor,
    and(
      eq(requests.status, RequestStatus.Created),
      eq(requests.cancelled, false),
      isNull(requests.specialistId),
    ),
    [desc(requests.createdAt), desc(requests.id)],
  );
  // Array.sort is stable: newest first is kept within each group.
  return rows.sort(
    (a, b) => Number(!isUrgent(a.priority)) - Number(!isUrgent(b.priority)),
  );
}
