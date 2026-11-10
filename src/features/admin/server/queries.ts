import { desc, eq, isNotNull } from "drizzle-orm";
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
