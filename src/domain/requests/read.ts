import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requests, requireDb, users } from "@/db";
import type { Actor } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { listReportPhotoIds } from "@/domain/photos";
import { withActions } from "./actions";
import type { ActionKind } from "./actions";
import { toDto } from "./dto";
import type { RequestDto } from "./dto";
import { forbidden, requireActor } from "./errors";
import { isActiveStage } from "./lifecycle";
import { RequestStatus } from "./types";

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
