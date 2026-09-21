import { count, desc, eq, lt } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { requests, tariffs, users } from "@/db/schema";
import { parseDescription } from "@/features/requests/server/queries";
import type {
  CategoryId,
  RequestStatus,
  ServiceRequest,
  Tariffs,
} from "@/features/requests/types";

export interface WorkspaceStatsData {
  total: number;
  active: number;
  completed: number;
  totalSpecialists?: number;
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
    .where(lt(requests.status, 5));
  const [completedResult] = await db
    .select({ value: count() })
    .from(requests)
    .where(eq(requests.status, 5));
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
    const rawStatus = request.status;
    const status: RequestStatus =
      rawStatus >= 0 && rawStatus <= 5 ? (rawStatus as RequestStatus) : 0;
    const parsed = parseDescription(request.description);

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
      status,
      description: parsed.cleanDescription,
      cancelled: parsed.cancelled,
      report: parsed.report,
      rating: parsed.rating,
      issue: parsed.issue,
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
