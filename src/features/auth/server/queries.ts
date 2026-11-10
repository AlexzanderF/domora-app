import { eq, or, type SQL } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { specialistProfiles, users } from "@/db/schema";
import type { User } from "@/domain/identity/types";
import { mapToDomainUser } from "@/domain/identity/session-user";

export interface UserWithPassword extends User {
  passwordHash: string;
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

export async function findUserById(userId: number): Promise<User | null> {
  const result = await querySingleUserRow(eq(users.id, userId));
  return result ? mapToDomainUser(result.user, result.profile) : null;
}
