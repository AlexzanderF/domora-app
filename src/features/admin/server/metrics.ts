import { and, count, eq, gte, inArray, ne, or, sum } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { requests, users } from "@/db/schema";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { RequestStatus } from "@/domain/requests/types";
import { RequestPriority } from "@/domain/requests/types";

export interface WorkspaceStatsData {
  total: number;
  active: number;
  completed: number;
  totalSpecialists?: number;
}

export interface AdminKpiMetrics {
  unassignedUrgentCount: number;
  pendingSpecialistsCount: number;
  activeRepairsCount: number;
  monthlyRevenue: number;
}

export async function findAdminKpiMetrics(): Promise<AdminKpiMetrics | null> {
  if (!isDbConfigured) {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  const [
    [unassignedUrgentResult],
    [pendingSpecialistsResult],
    [activeRepairsResult],
    [monthlyRevenueResult],
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(requests)
      .where(
        and(
          eq(requests.status, RequestStatus.Created),
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
        inArray(requests.status, [
          RequestStatus.Accepted,
          RequestStatus.InProgress,
          RequestStatus.AwaitingConfirmation,
        ]),
      ),
    db
      .select({ value: sum(requests.price) })
      .from(requests)
      .where(
        and(
          eq(requests.status, RequestStatus.Completed),
          or(
            gte(requests.updatedAt, startOfMonth),
            gte(requests.createdAt, startOfMonth),
          ),
        ),
      ),
  ]);

  return {
    unassignedUrgentCount: unassignedUrgentResult?.value ?? 0,
    pendingSpecialistsCount: pendingSpecialistsResult?.value ?? 0,
    activeRepairsCount: activeRepairsResult?.value ?? 0,
    monthlyRevenue: monthlyRevenueResult?.value
      ? Number(monthlyRevenueResult.value)
      : 0,
  };
}

export async function findOperationalMetrics(): Promise<WorkspaceStatsData | null> {
  if (!isDbConfigured) {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const [totalResult] = await db.select({ value: count() }).from(requests);
  const [activeResult] = await db
    .select({ value: count() })
    .from(requests)
    .where(ne(requests.status, RequestStatus.Completed));
  const [completedResult] = await db
    .select({ value: count() })
    .from(requests)
    .where(eq(requests.status, RequestStatus.Completed));
  const [specialistsResult] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, UserRole.Specialist));

  return {
    total: totalResult?.value ?? 0,
    active: activeResult?.value ?? 0,
    completed: completedResult?.value ?? 0,
    totalSpecialists: specialistsResult?.value ?? 0,
  };
}
