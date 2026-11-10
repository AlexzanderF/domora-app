import { and, eq, gt } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import {
  sessions,
  specialistProfiles,
  users,
  type SpecialistProfileSelect,
  type UserSelect,
} from "@/db/schema";
import type { User, SpecialistProfile } from "./types";
import { hashSessionToken } from "./token";

function mapToDomainProfile(
  profile: SpecialistProfileSelect | null,
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

export function mapToDomainUser(
  userRow: UserSelect,
  profileRow?: SpecialistProfileSelect | null,
): User {
  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    phone: userRow.phone,
    propertyAddress: userRow.propertyAddress ?? undefined,
    role: userRow.role,
    status: userRow.status,
    specialistProfile: mapToDomainProfile(profileRow ?? null),
    createdAt: userRow.createdAt.toISOString(),
    updatedAt: userRow.updatedAt.toISOString(),
  };
}

export async function findUserBySessionToken(
  token: string,
): Promise<User | null> {
  if (!isDbConfigured) return null;
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      user: users,
      profile: specialistProfiles,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(specialistProfiles, eq(users.id, specialistProfiles.userId))
    .where(
      and(
        eq(sessions.token, hashSessionToken(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (rows.length === 0) return null;

  return mapToDomainUser(rows[0].user, rows[0].profile);
}
