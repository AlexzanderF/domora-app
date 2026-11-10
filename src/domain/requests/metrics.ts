import { and, count, eq, gte, inArray, isNull, sum } from "drizzle-orm";
import { requests, requireDb, users } from "@/db";
import { can } from "@/domain/authorization";
import type { Actor } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { forbidden, requireActor } from "./errors";
import { ACTIVE_STAGES } from "./lifecycle";
import { RequestPriority, RequestStatus } from "./types";

// Framework-free (no next/*): the admin KPI numbers, defined with the same
// lifecycle predicates as the Triage Queues.

export interface RequestMetrics {
  // Claimable (unassigned, not cancelled) and Urgent or Emergency.
  unassignedUrgentCount: number;
  pendingSpecialistsCount: number;
  // In an active stage and not cancelled.
  activeRepairsCount: number;
  // Completed this month, by completion time.
  monthlyRevenue: number;
}

export async function requestMetrics(
  actorOrNull: Actor | null,
): Promise<RequestMetrics> {
  const actor = requireActor(actorOrNull);
  if (!can(actor, "request.list_all")) forbidden();

  const db = requireDb();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [[urgent], [pending], [active], [revenue]] = await Promise.all([
    db
      .select({ value: count() })
      .from(requests)
      .where(
        and(
          eq(requests.status, RequestStatus.Created),
          eq(requests.cancelled, false),
          isNull(requests.specialistId),
          inArray(requests.priority, [
            RequestPriority.Urgent,
            RequestPriority.Emergency,
          ]),
        ),
      ),
    db
      .select({ value: count() })
      .from(users)
      .where(
        and(
          eq(users.role, UserRole.Specialist),
          eq(users.status, UserStatus.Pending),
        ),
      ),
    db
      .select({ value: count() })
      .from(requests)
      .where(
        and(
          inArray(requests.status, [...ACTIVE_STAGES]),
          eq(requests.cancelled, false),
        ),
      ),
    db
      .select({ value: sum(requests.price) })
      .from(requests)
      .where(
        and(
          eq(requests.status, RequestStatus.Completed),
          gte(requests.completedAt, startOfMonth),
        ),
      ),
  ]);

  return {
    unassignedUrgentCount: urgent?.value ?? 0,
    pendingSpecialistsCount: pending?.value ?? 0,
    activeRepairsCount: active?.value ?? 0,
    monthlyRevenue: revenue?.value ? Number(revenue.value) : 0,
  };
}
