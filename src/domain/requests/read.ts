import { desc, eq } from "drizzle-orm";
import { requests, requireDb, users } from "@/db";
import type { Actor } from "@/domain/authorization";
import { UserRole } from "@/domain/identity/types";
import { listReportPhotoIds } from "@/domain/photos";
import { withActions } from "./actions";
import type { ActionKind } from "./actions";
import { toDto } from "./dto";
import type { RequestDto } from "./dto";
import { forbidden, requireActor } from "./errors";

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
