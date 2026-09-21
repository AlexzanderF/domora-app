import { desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { specialistProfiles, users } from "@/db/schema";
import type { User, SpecialistProfile } from "@/features/auth/types";

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
