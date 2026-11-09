import { and, eq } from "drizzle-orm";
import { requireDb, specialistProfiles, users } from "@/db";
import type { Actor } from "@/domain/authorization";
import { enqueueEvent } from "@/domain/notifications";
import { UserRole, UserStatus } from "@/features/auth/types";

// Framework-free (no next/*): who may use the platform. Specialists sign up as
// Pending and an admin approves or rejects them. Status is read from the
// database on every request, so a decision applies to the very next request.

export type IdentityErrorCode =
  "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID_INPUT";

export class IdentityError extends Error {
  constructor(
    readonly code: IdentityErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "IdentityError";
  }
}

export interface RegisterSpecialistInput {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  profile: {
    category: string;
    area: string;
    experienceYears: number;
    bio: string;
    companyName?: string | null;
    eik?: string | null;
  };
}

// Creates the user and profile together; the specialist starts Pending.
export async function registerSpecialist(
  input: RegisterSpecialistInput,
): Promise<number> {
  return requireDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        passwordHash: input.passwordHash,
        role: UserRole.Specialist,
        status: UserStatus.Pending,
      })
      .returning({ id: users.id });

    await tx.insert(specialistProfiles).values({
      userId: created.id,
      category: input.profile.category,
      area: input.profile.area,
      experienceYears: input.profile.experienceYears,
      bio: input.profile.bio,
      companyName: input.profile.companyName?.trim() || null,
      eik: input.profile.eik?.trim() || null,
    });
    await enqueueEvent(tx, {
      type: "specialist.registered",
      payload: { userId: created.id },
    });
    return created.id;
  });
}

// Admin decision on a specialist. Approval and rejection are reversible; a
// specialist never goes back to Pending.
export async function setSpecialistStatus(
  actor: Actor | null,
  userId: number,
  status: UserStatus,
): Promise<void> {
  if (!actor) {
    throw new IdentityError("UNAUTHENTICATED", "Sign in required.");
  }
  if (actor.role !== UserRole.Admin) {
    throw new IdentityError("FORBIDDEN", "Admin rights required.");
  }
  if (status !== UserStatus.Active && status !== UserStatus.Rejected) {
    throw new IdentityError("INVALID_INPUT", "Invalid specialist status.");
  }

  await requireDb().transaction(async (tx) => {
    const [current] = await tx
      .select({ status: users.status })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.role, UserRole.Specialist)))
      .for("update");
    if (!current) {
      throw new IdentityError("NOT_FOUND", "Specialist not found.");
    }
    // Repeating a decision changes nothing and tells nobody.
    if (current.status === status) return;
    await tx
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId));
    await enqueueEvent(tx, {
      type:
        status === UserStatus.Active
          ? "specialist.approved"
          : "specialist.rejected",
      payload: { userId },
    });
  });
}

export interface BootstrapAdminInput {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
}

// Creates the first admin on a fresh server. Does nothing once any admin
// exists, so it is safe to run on every deploy.
export async function bootstrapAdmin(
  input: BootstrapAdminInput,
): Promise<{ created: boolean }> {
  return requireDb().transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, UserRole.Admin))
      .limit(1);
    if (existing) return { created: false };

    await tx.insert(users).values({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      passwordHash: input.passwordHash,
      role: UserRole.Admin,
      status: UserStatus.Active,
    });
    return { created: true };
  });
}
