import { and, eq, gt, or } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import {
  sessions,
  specialistProfiles,
  users,
  type SpecialistProfileSelect,
  type UserSelect,
} from "@/db/schema";
import type { User, SpecialistProfile } from "../types";

export interface UserWithPassword extends User {
  passwordHash: string;
}

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

function mapToDomainUser(
  userRow: UserSelect,
  profileRow?: SpecialistProfileSelect | null,
): User {
  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    phone: userRow.phone,
    role: userRow.role,
    status: userRow.status,
    specialistProfile: mapToDomainProfile(profileRow ?? null),
    createdAt: userRow.createdAt.toISOString(),
    updatedAt: userRow.updatedAt.toISOString(),
  };
}

export async function findUserByEmailOrPhone(
  identifier: string,
): Promise<User | null> {
  if (!isDbConfigured) return null;
  const db = getDb();
  if (!db) return null;

  const cleanIdentifier = identifier.trim().toLowerCase();
  const rawIdentifier = identifier.trim();

  const rows = await db
    .select({
      user: users,
      profile: specialistProfiles,
    })
    .from(users)
    .leftJoin(specialistProfiles, eq(users.id, specialistProfiles.userId))
    .where(
      or(
        eq(users.email, cleanIdentifier),
        eq(users.phone, rawIdentifier),
        eq(users.phone, cleanIdentifier),
      ),
    )
    .limit(1);

  if (rows.length === 0) return null;

  return mapToDomainUser(rows[0].user, rows[0].profile);
}

export async function findUserWithPasswordByEmailOrPhone(
  identifier: string,
): Promise<UserWithPassword | null> {
  if (!isDbConfigured) return null;
  const db = getDb();
  if (!db) return null;

  const cleanIdentifier = identifier.trim().toLowerCase();
  const rawIdentifier = identifier.trim();

  const rows = await db
    .select({
      user: users,
      profile: specialistProfiles,
    })
    .from(users)
    .leftJoin(specialistProfiles, eq(users.id, specialistProfiles.userId))
    .where(
      or(
        eq(users.email, cleanIdentifier),
        eq(users.phone, rawIdentifier),
        eq(users.phone, cleanIdentifier),
      ),
    )
    .limit(1);

  if (rows.length === 0) return null;

  const domainUser = mapToDomainUser(rows[0].user, rows[0].profile);
  return {
    ...domainUser,
    passwordHash: rows[0].user.passwordHash,
  };
}

export async function findUserById(userId: string): Promise<User | null> {
  if (!isDbConfigured) return null;
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      user: users,
      profile: specialistProfiles,
    })
    .from(users)
    .leftJoin(specialistProfiles, eq(users.id, specialistProfiles.userId))
    .where(eq(users.id, userId))
    .limit(1);

  if (rows.length === 0) return null;

  return mapToDomainUser(rows[0].user, rows[0].profile);
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
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (rows.length === 0) return null;

  return mapToDomainUser(rows[0].user, rows[0].profile);
}
