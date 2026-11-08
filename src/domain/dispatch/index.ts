import { and, desc, eq, isNull } from "drizzle-orm";
import { requireDb, requests, specialistProfiles, users } from "@/db";
import type { RequestSelect } from "@/db";
import { can } from "@/domain/authorization";
import type { Actor } from "@/domain/authorization";
import {
  RequestError,
  forbidden,
  invalidState,
  recordEvent,
  requireActor,
  resourceOf,
  toDto,
} from "@/domain/requests";
import type { RequestDto, Tx } from "@/domain/requests";
import { UserRole, UserStatus } from "@/features/auth/types";
import { canClaim } from "@/features/requests/request-rules";
import { RequestStatus } from "@/features/requests/types";

// Framework-free (no next/*): dispatch decides who may take an open request.
// Claiming, admin assignment and recommendations all lock the request row so
// two actors can never both win the same job.

// Request categories are stored as codes "0".."5"; specialist profiles store
// the trade by name (signup list and legacy seed spellings).
const TRADE_CODES: Record<string, string> = {
  ВиК: "0",
  Електро: "1",
  Климатизация: "2",
  Климатици: "2",
  Ремонти: "3",
  "Ремонти и монтажи": "3",
  Почистване: "4",
  Други: "5",
  Друго: "5",
};

interface Profile {
  category: string;
  area: string;
}

function matchesProfile(
  request: Pick<RequestSelect, "category" | "address">,
  profile: Profile | undefined,
): boolean {
  if (!profile) return false;
  const trade = profile.category.trim();
  const code = TRADE_CODES[trade] ?? trade;
  if (code !== request.category) return false;
  const area = profile.area.trim().toLowerCase();
  return area !== "" && request.address.toLowerCase().includes(area);
}

async function profileOf(
  db: Pick<Tx, "select">,
  userId: number,
): Promise<Profile | undefined> {
  const [profile] = await db
    .select({
      category: specialistProfiles.category,
      area: specialistProfiles.area,
    })
    .from(specialistProfiles)
    .where(eq(specialistProfiles.userId, userId));
  return profile;
}

// Open requests the actor could take: matching trade and area for an Active
// specialist (recommended ones first), every open request for an admin, and
// nothing for anyone else, Pending/Rejected specialists included.
export async function listOpportunities(
  actorOrNull: Actor | null,
): Promise<RequestDto[]> {
  const actor = requireActor(actorOrNull);
  const isAdmin = actor.role === UserRole.Admin;
  const isActiveSpecialist =
    actor.role === UserRole.Specialist && actor.status === UserStatus.Active;
  if (!isAdmin && !isActiveSpecialist) return [];

  const db = requireDb();
  const profile = isAdmin ? undefined : await profileOf(db, actor.id);
  if (!isAdmin && !profile) return [];

  const rows = await db
    .select()
    .from(requests)
    .where(
      and(
        isNull(requests.specialistId),
        eq(requests.status, RequestStatus.Created),
        eq(requests.cancelled, false),
      ),
    )
    .orderBy(desc(requests.createdAt), desc(requests.id));

  const visible = isAdmin
    ? rows
    : rows.filter((row) => matchesProfile(row, profile));
  const rank = (row: RequestSelect) =>
    row.recommendedSpecialistId === actor.id ? 0 : 1;
  return visible.sort((a, b) => rank(a) - rank(b)).map(toDto);
}

function isDispatcher(actor: Actor): boolean {
  return (
    actor.role === UserRole.Admin ||
    (actor.role === UserRole.Specialist && actor.status === UserStatus.Active)
  );
}

// Locks the request, requires it to still be open for taking (so a losing
// racer gets INVALID_STATE), and lets `apply` authorize and describe the change.
async function dispatchChange(
  actorOrNull: Actor | null,
  requestId: number,
  apply: (
    row: RequestSelect,
    actor: Actor,
    tx: Tx,
  ) => Promise<{ type: string; values: Partial<typeof requests.$inferInsert> }>,
): Promise<RequestDto> {
  const actor = requireActor(actorOrNull);
  return requireDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(requests)
      .where(eq(requests.id, requestId))
      .for("update");
    if (!row) throw new RequestError("NOT_FOUND", "Request not found.");
    // Only admins and Active specialists may touch dispatch at all, so others
    // never learn whether a request is still open.
    if (!isDispatcher(actor)) forbidden();
    if (!canClaim(row)) invalidState("The request is no longer available.");
    const change = await apply(row, actor, tx);
    const [updated] = await tx
      .update(requests)
      .set({ ...change.values, updatedAt: new Date() })
      .where(eq(requests.id, row.id))
      .returning();
    await recordEvent(tx, {
      requestId: row.id,
      actorId: actor.id,
      type: change.type,
      fromStatus: row.status,
      toStatus: updated.status,
    });
    return toDto(updated);
  });
}

const NO_RECOMMENDATION = {
  recommendedSpecialistId: null,
  recommendedById: null,
  recommendedAt: null,
} as const;

// A specialist takes an open request; an admin may take any. Specialists must
// be Active and match the request's trade and area.
export function claimRequest(
  actor: Actor | null,
  requestId: number,
): Promise<RequestDto> {
  return dispatchChange(actor, requestId, async (row, who, tx) => {
    if (!can(who, "request.claim", resourceOf(row))) forbidden();
    if (
      who.role === UserRole.Specialist &&
      !matchesProfile(row, await profileOf(tx, who.id))
    ) {
      forbidden();
    }
    return {
      type: "request.accepted",
      values: {
        specialistId: who.id,
        status: RequestStatus.Accepted,
        ...NO_RECOMMENDATION,
      },
    };
  });
}

async function requireActiveSpecialist(
  tx: Tx,
  specialistId: number,
): Promise<void> {
  const [target] = await tx
    .select({ role: users.role, status: users.status })
    .from(users)
    .where(eq(users.id, specialistId));
  if (
    !target ||
    target.role !== UserRole.Specialist ||
    target.status !== UserStatus.Active
  ) {
    throw new RequestError(
      "INVALID_INPUT",
      "The chosen specialist is not active.",
    );
  }
}

// Admin dispatch: hands an open request straight to an Active specialist.
export function assignSpecialist(
  actor: Actor | null,
  requestId: number,
  specialistId: number,
): Promise<RequestDto> {
  return dispatchChange(actor, requestId, async (row, who, tx) => {
    if (!can(who, "request.assign", resourceOf(row))) forbidden();
    await requireActiveSpecialist(tx, specialistId);
    return {
      type: "request.assigned",
      values: {
        specialistId,
        status: RequestStatus.Accepted,
        dispatchedByAdmin: true,
        ...NO_RECOMMENDATION,
      },
    };
  });
}

// Admin flags an open request for a specialist, recording who and when.
export function recommendRequest(
  actor: Actor | null,
  requestId: number,
  specialistId: number,
): Promise<RequestDto> {
  return dispatchChange(actor, requestId, async (row, who, tx) => {
    if (!can(who, "request.assign", resourceOf(row))) forbidden();
    await requireActiveSpecialist(tx, specialistId);
    return {
      type: "request.recommended",
      values: {
        recommendedSpecialistId: specialistId,
        recommendedById: who.id,
        recommendedAt: new Date(),
      },
    };
  });
}

// The recommended specialist turns the recommendation down; the request stays
// open for everyone else.
export function declineRecommendation(
  actor: Actor | null,
  requestId: number,
): Promise<RequestDto> {
  return dispatchChange(actor, requestId, async (row, who) => {
    if (
      !can(who, "request.claim", resourceOf(row)) ||
      row.recommendedSpecialistId !== who.id
    ) {
      forbidden();
    }
    return {
      type: "request.recommendation_declined",
      values: NO_RECOMMENDATION,
    };
  });
}
