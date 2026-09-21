import { and, eq, gt, or, type SQL } from "drizzle-orm";
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

async function querySingleUserRow(whereCondition: SQL) {
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
    .where(whereCondition)
    .limit(1);

  return rows.length > 0 ? rows[0] : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await querySingleUserRow(eq(users.email, normalizedEmail));
  return result ? mapToDomainUser(result.user, result.profile) : null;
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  const normalizedPhone = phone.trim();
  const result = await querySingleUserRow(eq(users.phone, normalizedPhone));
  return result ? mapToDomainUser(result.user, result.profile) : null;
}

export async function findUserByEmailOrPhone(
  identifier: string,
): Promise<User | null> {
  const normalized = identifier.trim();
  const normalizedEmail = normalized.toLowerCase();

  const result = await querySingleUserRow(
    or(eq(users.email, normalizedEmail), eq(users.phone, normalized)) as SQL,
  );

  return result ? mapToDomainUser(result.user, result.profile) : null;
}

export async function findUserWithPasswordByEmailOrPhone(
  identifier: string,
): Promise<UserWithPassword | null> {
  const normalized = identifier.trim();
  const normalizedEmail = normalized.toLowerCase();

  const result = await querySingleUserRow(
    or(eq(users.email, normalizedEmail), eq(users.phone, normalized)) as SQL,
  );

  if (!result) return null;

  const domainUser = mapToDomainUser(result.user, result.profile);
  return {
    ...domainUser,
    passwordHash: result.user.passwordHash,
  };
}

export async function findUserById(userId: string): Promise<User | null> {
  const result = await querySingleUserRow(eq(users.id, userId));
  return result ? mapToDomainUser(result.user, result.profile) : null;
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
