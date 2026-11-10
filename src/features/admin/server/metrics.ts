import { and, count, desc, eq, gte, inArray, ne, or, sum } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { requests, users } from "@/db/schema";
import type { Actor } from "@/domain/authorization";
import { withActions } from "@/domain/requests/actions";
import type { CategoryId, ServiceRequest } from "@/domain/requests/types";
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

export async function findAllRequestsForAdmin(
  actor: Actor | null,
): Promise<ServiceRequest[] | null> {
  if (!isDbConfigured || !actor) {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      request: requests,
      specialist: users,
    })
    .from(requests)
    .leftJoin(users, eq(requests.specialistId, users.id))
    .orderBy(desc(requests.createdAt));

  return rows.map(({ request, specialist }) => {
    const rawCategory = Number(request.category);
    const category: CategoryId =
      rawCategory >= 0 && rawCategory <= 5 ? (rawCategory as CategoryId) : 0;

    return withActions(
      actor,
      {
        id: request.id,
        category,
        service: request.title,
        address: request.address,
        date: request.createdAt.toISOString().split("T")[0],
        time: request.createdAt.toLocaleTimeString("bg-BG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        price: request.price,
        status: request.status,
        priority: request.priority,
        description: request.description,
        cancelled: request.cancelled,
        report: request.report ?? undefined,
        rating: request.rating ?? undefined,
        issue: request.issue || undefined,
        issueNote: request.issueNote ?? undefined,
        specialist: specialist?.name,
      },
      request,
    );
  });
}
