import { and, desc, eq, like, not } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, isDbConfigured } from "@/db";
import { requests, specialistProfiles, users } from "@/db/schema";
import type { User, SpecialistProfile } from "@/features/auth/types";
import { parseDescription } from "@/features/requests/server/queries";
import type {
  CategoryId,
  RequestStatus,
  ServiceRequest,
} from "@/features/requests/types";

function mapToDomainProfile(
  profile: typeof specialistProfiles.$inferSelect | null,
): SpecialistProfile | undefined {
  if (!profile) return undefined;
  return {
    category: profile.category,
    area: profile.area,
    experienceYears: profile.experienceYears,
    bio: profile.bio,
    companyName: profile.companyName ?? undefined,
    eik: profile.eik ?? undefined,
  };
}

export async function findSpecialistApplications(): Promise<User[] | null> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      user: users,
      profile: specialistProfiles,
    })
    .from(users)
    .leftJoin(specialistProfiles, eq(users.id, specialistProfiles.userId))
    .where(eq(users.role, "SPECIALIST"))
    .orderBy(desc(users.createdAt));

  return rows.map((row) => ({
    id: row.user.id,
    name: row.user.name,
    email: row.user.email,
    phone: row.user.phone,
    role: row.user.role,
    status: row.user.status,
    specialistProfile: mapToDomainProfile(row.profile),
    createdAt: row.user.createdAt.toISOString(),
    updatedAt: row.user.updatedAt.toISOString(),
  }));
}

export async function findDisputedRequestsForAdmin(): Promise<
  ServiceRequest[] | null
> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const specialists = alias(users, "specialists");
  const clients = alias(users, "clients");

  const rows = await db
    .select({
      request: requests,
      specialist: specialists,
      client: clients,
    })
    .from(requests)
    .leftJoin(specialists, eq(requests.specialistId, specialists.id))
    .leftJoin(clients, eq(requests.clientId, clients.id))
    .where(like(requests.description, "%[СИГНАЛ]%"))
    .orderBy(desc(requests.updatedAt));

  return rows.map(({ request, specialist, client }) => {
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
      priority: request.priority,
      description: parsed.cleanDescription,
      cancelled: parsed.cancelled,
      report: parsed.report,
      rating: parsed.rating,
      issue: parsed.issue,
      specialist: specialist?.name,
      specialistPhone: specialist?.phone,
      clientName: client?.name,
      clientPhone: request.clientPhone,
    };
  });
}

function isUrgentPriority(priority: string): boolean {
  return priority === "URGENT" || priority === "EMERGENCY";
}

export async function findUnassignedRequestsForAdmin(): Promise<
  ServiceRequest[] | null
> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const clients = alias(users, "clients");

  const rows = await db
    .select({
      request: requests,
      client: clients,
    })
    .from(requests)
    .leftJoin(clients, eq(requests.clientId, clients.id))
    .where(
      and(
        eq(requests.status, 0),
        not(like(requests.description, "[ОТКАЗАНА]%")),
      ),
    )
    .orderBy(desc(requests.createdAt));

  const mapped = rows.map(({ request, client }) => {
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
      priority: request.priority,
      description: parsed.cleanDescription,
      cancelled: parsed.cancelled,
      report: parsed.report,
      rating: parsed.rating,
      issue: parsed.issue,
      recommendedSpecialistId: parsed.recommendedSpecialistId,
      dispatchedByAdmin: parsed.dispatchedByAdmin,
      clientName: client?.name,
      clientPhone: request.clientPhone,
    };
  });

  // Urgent and emergency requests first, then newest first.
  return mapped.sort((a, b) => {
    const aUrgent = a.priority && isUrgentPriority(a.priority) ? 0 : 1;
    const bUrgent = b.priority && isUrgentPriority(b.priority) ? 0 : 1;
    return aUrgent - bUrgent;
  });
}
