import { desc, eq, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, isDbConfigured } from "@/db";
import { requests, users } from "@/db/schema";
import type { RequestSelect } from "@/db/schema";
import { listOpportunities } from "@/domain/dispatch";
import type { Actor } from "@/domain/authorization";
import { UserStatus } from "@/features/auth/types";
import type { CategoryId, ServiceRequest } from "../types";

// The booked date and time window; rows that predate the columns fall back to
// when they were created.
function scheduleOf(request: RequestSelect): { date: string; time: string } {
  return {
    date:
      request.scheduledDate ?? request.createdAt.toISOString().split("T")[0],
    time:
      request.scheduledTime ??
      request.createdAt.toLocaleTimeString("bg-BG", {
        hour: "2-digit",
        minute: "2-digit",
      }),
  };
}

export async function findClientRequests(
  clientId: number,
): Promise<ServiceRequest[] | null> {
  if (!isDbConfigured) {
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
    .where(eq(requests.clientId, clientId))
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
      ...scheduleOf(request),
      price: request.price,
      status: request.status,
      description: request.description,
      cancelled: request.cancelled,
      report: request.report ?? undefined,
      rating: request.rating ?? undefined,
      issue: request.issue || undefined,
      issueNote: request.issueNote ?? undefined,
      specialist: specialist?.name,
      specialistPhone: specialist?.phone,
    };
  });
}

// The specialist's assigned requests plus the open jobs dispatch lets them
// see (matching trade and area; none for Pending/Rejected specialists).
export async function findSpecialistRequests(
  actor: Actor,
): Promise<ServiceRequest[] | null> {
  if (!isDbConfigured) {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const specialistId = actor.id;
  const opportunityIds = (await listOpportunities(actor)).map((r) => r.id);
  const whereCondition =
    actor.status === UserStatus.Active
      ? or(
          eq(requests.specialistId, specialistId),
          inArray(requests.id, opportunityIds),
        )
      : sql`false`;

  const clients = alias(users, "clients");

  const rows = await db
    .select({
      request: requests,
      specialist: users,
      client: clients,
    })
    .from(requests)
    .leftJoin(users, eq(requests.specialistId, users.id))
    .leftJoin(clients, eq(requests.clientId, clients.id))
    .where(whereCondition)
    .orderBy(desc(requests.createdAt));

  return rows
    .map(({ request, specialist, client }) => {
      const rawCategory = Number(request.category);
      const categoryId: CategoryId =
        rawCategory >= 0 && rawCategory <= 5 ? (rawCategory as CategoryId) : 0;

      return {
        id: request.id,
        category: categoryId,
        service: request.title,
        address: request.address,
        ...scheduleOf(request),
        price: request.price,
        status: request.status,
        priority: request.priority,
        description: request.description,
        cancelled: request.cancelled,
        report: request.report ?? undefined,
        rating: request.rating ?? undefined,
        issue: request.issue || undefined,
        issueNote: request.issueNote ?? undefined,
        recommendedSpecialistId: request.recommendedSpecialistId ?? undefined,
        dispatchedByAdmin: request.dispatchedByAdmin || undefined,
        specialist:
          request.specialistId === specialistId ? "Вие" : specialist?.name,
        specialistPhone: specialist?.phone,
        clientName: client?.name,
        clientPhone: request.clientPhone,
      };
    })
    .sort((a, b) => {
      // Requests recommended to the viewing specialist float to the top.
      const aRecommended = a.recommendedSpecialistId === specialistId ? 0 : 1;
      const bRecommended = b.recommendedSpecialistId === specialistId ? 0 : 1;
      return aRecommended - bRecommended;
    });
}
