import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, isDbConfigured } from "@/db";
import { requests, users } from "@/db/schema";
import {
  hasDispatchMarker,
  hasIssueMarker,
  isCancelledDescription,
  parseIssueNote,
  parseRating,
  parseRecommendMarker,
  parseReport,
  stripAllMarkers,
} from "../dispatch-markers";
import type { CategoryId, RequestStatus, ServiceRequest } from "../types";

const CATEGORY_NAMES: Record<string, string> = {
  "0": "0",
  ВиК: "0",
  "1": "1",
  Електро: "1",
  "2": "2",
  Климатизация: "2",
  "3": "3",
  Ремонти: "3",
  "4": "4",
  Почистване: "4",
  "5": "5",
  Други: "5",
};

export function parseDescription(description: string): {
  cleanDescription: string;
  cancelled: boolean;
  report?: string;
  rating?: number;
  issue?: boolean;
  issueNote?: string;
  recommendedSpecialistId?: number;
  dispatchedByAdmin?: boolean;
} {
  const cancelled = isCancelledDescription(description);

  return {
    cleanDescription: stripAllMarkers(description),
    cancelled,
    report: parseReport(description),
    rating: parseRating(description),
    issue: hasIssueMarker(description) || undefined,
    issueNote: parseIssueNote(description),
    recommendedSpecialistId: parseRecommendMarker(description),
    dispatchedByAdmin: hasDispatchMarker(description) || undefined,
  };
}

export async function findClientRequests(
  clientId: number,
): Promise<ServiceRequest[] | null> {
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
    .where(eq(requests.clientId, clientId))
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
      issueNote: parsed.issueNote,
      specialist: specialist?.name,
      specialistPhone: specialist?.phone,
    };
  });
}

export async function findSpecialistRequests(
  specialistId: number,
  category?: string,
  area?: string,
): Promise<ServiceRequest[] | null> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const assignedCondition = eq(requests.specialistId, specialistId);
  const conditions = [isNull(requests.specialistId), eq(requests.status, 0)];

  if (category) {
    const catCode = CATEGORY_NAMES[category] ?? category;
    conditions.push(eq(requests.category, catCode));
  }

  if (area?.trim()) {
    conditions.push(ilike(requests.address, `%${area.trim()}%`));
  }

  const availableCondition = and(...conditions);
  const whereCondition = or(assignedCondition, availableCondition);

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
      const rawStatus = request.status;
      const status: RequestStatus =
        rawStatus >= 0 && rawStatus <= 5 ? (rawStatus as RequestStatus) : 0;
      const parsed = parseDescription(request.description);

      return {
        id: request.id,
        category: categoryId,
        service: request.title,
        address: request.address,
        date: request.createdAt.toISOString().split("T")[0],
        time: request.createdAt.toLocaleTimeString("bg-BG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        price: request.price,
        status,
        priority: request.priority,
        description: parsed.cleanDescription,
        cancelled: parsed.cancelled,
        report: parsed.report,
        rating: parsed.rating,
        issue: parsed.issue,
        issueNote: parsed.issueNote,
        recommendedSpecialistId: parsed.recommendedSpecialistId,
        dispatchedByAdmin: parsed.dispatchedByAdmin,
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
