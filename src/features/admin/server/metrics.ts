import { and, count, desc, eq, gte, inArray, ne, or, sum } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { requests, tariffs, users } from "@/db/schema";
import type {
  CategoryId,
  ServiceRequest,
  Tariffs,
} from "@/features/requests/types";

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
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
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
          eq(requests.status, "CREATED"),
          inArray(requests.priority, ["URGENT", "EMERGENCY"]),
        ),
      ),
    db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, "SPECIALIST"), eq(users.status, "PENDING"))),
    db
      .select({ value: count() })
      .from(requests)
      .where(
        inArray(requests.status, [
          "ACCEPTED",
          "IN_PROGRESS",
          "AWAITING_CONFIRMATION",
        ]),
      ),
    db
      .select({ value: sum(requests.price) })
      .from(requests)
      .where(
        and(
          eq(requests.status, "COMPLETED"),
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
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const [totalResult] = await db.select({ value: count() }).from(requests);
  const [activeResult] = await db
    .select({ value: count() })
    .from(requests)
    .where(ne(requests.status, "COMPLETED"));
  const [completedResult] = await db
    .select({ value: count() })
    .from(requests)
    .where(eq(requests.status, "COMPLETED"));
  const [specialistsResult] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "SPECIALIST"));

  return {
    total: totalResult?.value ?? 0,
    active: activeResult?.value ?? 0,
    completed: completedResult?.value ?? 0,
    totalSpecialists: specialistsResult?.value ?? 0,
  };
}

export async function findAllRequestsForAdmin(): Promise<
  ServiceRequest[] | null
> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
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

    return {
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
    };
  });
}

export async function findDatabaseTariffs(): Promise<Tariffs | null> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const rows = await db.select().from(tariffs);
  if (!rows || rows.length === 0) return null;

  const result: Tariffs = {
    categories: { 0: 45, 1: 35, 2: 55, 3: 25, 4: 65, 5: 25 },
    home: 1.5,
    entry: 18,
  };

  for (const row of rows) {
    const catNum = Number(row.category);
    if (!Number.isNaN(catNum) && catNum >= 0 && catNum <= 5) {
      result.categories[catNum as CategoryId] = row.standardRate;
    } else if (row.category === "home") {
      result.home =
        row.standardRate > 20 ? row.standardRate / 10 : row.standardRate;
    } else if (row.category === "entry") {
      result.entry = row.standardRate;
    }
  }

  return result;
}
