import { and, desc, eq, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, isDbConfigured } from "@/db";
import {
  requestDisputes,
  requests,
  specialistProfiles,
  users,
} from "@/db/schema";
import type { User, SpecialistProfile } from "@/domain/identity/types";
import { UserRole } from "@/domain/identity/types";
import { listReportPhotoIds } from "@/domain/photos";
import { isUrgentPriority } from "@/features/requests/priority";
import { RequestStatus } from "@/domain/requests/types";
import type { CategoryId, ServiceRequest } from "@/domain/requests/types";

type AdminRequestRow = {
  request: typeof requests.$inferSelect;
  specialist?: typeof users.$inferSelect | null;
  client?: typeof users.$inferSelect | null;
};

function mapAdminRequestRow(
  { request, specialist, client }: AdminRequestRow,
  reportPhotoIds?: number[],
): ServiceRequest {
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
    reportPhotoIds,
    rating: request.rating ?? undefined,
    issue: request.issue || undefined,
    issueNote: request.issueNote ?? undefined,
    recommendedSpecialistId: request.recommendedSpecialistId ?? undefined,
    dispatchedByAdmin: request.dispatchedByAdmin || undefined,
    specialist: specialist?.name,
    specialistPhone: specialist?.phone,
    clientName: client?.name,
    clientPhone: request.clientPhone,
  };
}

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
  if (!isDbConfigured) {
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
    .where(eq(users.role, UserRole.Specialist))
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
  if (!isDbConfigured) {
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
    .where(eq(requests.issue, true))
    .orderBy(desc(requests.updatedAt));
  const reportPhotos = await listReportPhotoIds(rows.map((r) => r.request.id));

  return rows.map((row) =>
    mapAdminRequestRow(row, reportPhotos.get(row.request.id)),
  );
}

export async function findUnassignedRequestsForAdmin(): Promise<
  ServiceRequest[] | null
> {
  if (!isDbConfigured) {
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
        eq(requests.status, RequestStatus.Created),
        eq(requests.cancelled, false),
      ),
    )
    .orderBy(desc(requests.createdAt));

  const mapped = rows.map((row) => mapAdminRequestRow(row));

  // Urgent and emergency requests first, then newest first.
  return mapped.sort((a, b) => {
    const aUrgent = isUrgentPriority(a.priority) ? 0 : 1;
    const bUrgent = isUrgentPriority(b.priority) ? 0 : 1;
    return aUrgent - bUrgent;
  });
}

// One closed dispute for the triage history: the client's note, how the admin
// closed it, and who and when.
export interface ResolvedDispute {
  id: number;
  requestId: number;
  service: string;
  clientName?: string;
  specialist?: string;
  note: string;
  raisedAt: string;
  resolutionNote?: string;
  resolvedAt: string;
  resolvedByName?: string;
}

const RESOLVED_HISTORY_LIMIT = 20;

export async function findResolvedDisputesForAdmin(): Promise<
  ResolvedDispute[] | null
> {
  if (!isDbConfigured) {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const specialists = alias(users, "specialists");
  const clients = alias(users, "clients");
  const resolvers = alias(users, "resolvers");

  const rows = await db
    .select({
      dispute: requestDisputes,
      request: requests,
      specialist: specialists,
      client: clients,
      resolver: resolvers,
    })
    .from(requestDisputes)
    .innerJoin(requests, eq(requestDisputes.requestId, requests.id))
    .leftJoin(specialists, eq(requests.specialistId, specialists.id))
    .leftJoin(clients, eq(requests.clientId, clients.id))
    .leftJoin(resolvers, eq(requestDisputes.resolvedById, resolvers.id))
    .where(isNotNull(requestDisputes.resolvedAt))
    .orderBy(desc(requestDisputes.resolvedAt), desc(requestDisputes.id))
    .limit(RESOLVED_HISTORY_LIMIT);

  return rows.map(({ dispute, request, specialist, client, resolver }) => ({
    id: dispute.id,
    requestId: request.id,
    service: request.title,
    clientName: client?.name,
    specialist: specialist?.name,
    note: dispute.note,
    raisedAt: dispute.raisedAt.toISOString(),
    resolutionNote: dispute.resolutionNote ?? undefined,
    resolvedAt: (dispute.resolvedAt as Date).toISOString(),
    resolvedByName: resolver?.name,
  }));
}
