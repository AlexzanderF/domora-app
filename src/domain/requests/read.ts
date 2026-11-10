import { and, desc, eq, isNull } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requests, requireDb, users } from "@/db";
import { can } from "@/domain/authorization";
import type { Actor } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { listReportPhotoIds } from "@/domain/photos";
import { withActions } from "./actions";
import type { ActionKind } from "./actions";
import { toDto } from "./dto";
import type { RequestDto } from "./dto";
import { forbidden, requireActor } from "./errors";
import { isActiveStage } from "./lifecycle";
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

// ---- Specialist views ----------------------------------------------------

export interface AgendaRequest extends RequestDto {
  clientName: string | null;
  actions: ActionKind[];
}

// Only an Active specialist works requests; everyone else has no agenda.
const isWorkingSpecialist = (actor: Actor): boolean =>
  actor.role === UserRole.Specialist && actor.status === UserStatus.Active;

// The specialist's own accepted and in-flight requests, newest first. Empty
// for admins, clients and Pending/Rejected specialists.
export async function listAgenda(
  actorOrNull: Actor | null,
): Promise<AgendaRequest[]> {
  const actor = requireActor(actorOrNull);
  if (!isWorkingSpecialist(actor)) return [];

  const clients = alias(users, "clients");
  const rows = await requireDb()
    .select({ request: requests, client: clients })
    .from(requests)
    .leftJoin(clients, eq(requests.clientId, clients.id))
    .where(eq(requests.specialistId, actor.id))
    .orderBy(desc(requests.createdAt), desc(requests.id));

  return rows
    .filter(
      ({ request }) => !request.cancelled && isActiveStage(request.status),
    )
    .map(({ request, client }) =>
      withActions(
        actor,
        { ...toDto(request), clientName: client?.name ?? null },
        request,
      ),
    );
}

export interface SpecialistSummary {
  activeJobs: number;
  todaysEarnings: number;
}

// Dashboard figures for the specialist: tasks in flight and what the visits
// completed on `today` (a YYYY-MM-DD date) paid.
export async function specialistSummary(
  actorOrNull: Actor | null,
  today: string,
): Promise<SpecialistSummary> {
  const actor = requireActor(actorOrNull);
  if (!isWorkingSpecialist(actor)) return { activeJobs: 0, todaysEarnings: 0 };

  const rows = await requireDb()
    .select()
    .from(requests)
    .where(eq(requests.specialistId, actor.id));
  const live = rows.filter((row) => !row.cancelled);
  return {
    activeJobs: live.filter((row) => isActiveStage(row.status)).length,
    todaysEarnings: live
      .filter(
        (row) =>
          row.status === RequestStatus.Completed &&
          (row.scheduledDate ?? row.createdAt.toISOString().split("T")[0]) ===
            today,
      )
      .reduce((sum, row) => sum + row.price, 0),
  };
}
