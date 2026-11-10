import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, count, eq, gt, isNull, lte, ne, or } from "drizzle-orm";
import {
  passwordResetTokens,
  requireDb,
  sessions,
  specialistProfiles,
  users,
} from "@/db";
import { can, type Actor } from "@/domain/authorization";
import { enqueueEvent } from "@/domain/notifications";
import { hashSessionToken } from "@/domain/identity/token";
import { UserRole, UserStatus } from "@/domain/identity/types";

// Framework-free (no next/*): who may use the platform. Specialists sign up as
// Pending and an admin approves or rejects them. Status is read from the
// database on every request, so a decision applies to the very next request.

export type IdentityErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "INVALID_TOKEN"
  | "EMAIL_TAKEN"
  | "PHONE_TAKEN"
  | "INVALID_CREDENTIALS"
  | "REJECTED_SPECIALIST";

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

const PASSWORD_HASH_ROUNDS = 10;

export interface RegisterClientInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

type Tx = Parameters<
  Parameters<ReturnType<typeof requireDb>["transaction"]>[0]
>[0];

// Email and phone identify one account; `ownId` lets a user keep their own.
async function assertContactFree(
  tx: Tx,
  email: string,
  phone: string,
  ownId?: number,
): Promise<void> {
  const others = ownId === undefined ? undefined : ne(users.id, ownId);
  const [emailOwner] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), others))
    .limit(1);
  if (emailOwner) {
    throw new IdentityError("EMAIL_TAKEN", "Email is already registered.");
  }
  const [phoneOwner] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.phone, phone), others))
    .limit(1);
  if (phoneOwner) {
    throw new IdentityError("PHONE_TAKEN", "Phone is already registered.");
  }
}

// Creates an Active client; the password is hashed here.
export async function registerClient(
  input: RegisterClientInput,
): Promise<number> {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);
  return requireDb().transaction(async (tx) => {
    await assertContactFree(tx, email, phone);
    const [created] = await tx
      .insert(users)
      .values({
        name: input.name.trim(),
        email,
        phone,
        passwordHash,
        role: UserRole.Client,
        status: UserStatus.Active,
      })
      .returning({ id: users.id });
    await enqueueEvent(tx, {
      type: "account.client_registered",
      payload: { userId: created.id },
    });
    return created.id;
  });
}

// Checks email-or-phone plus password and returns the user's id. A wrong
// password and an unknown account are indistinguishable. Writes no event.
export async function authenticate(
  identifier: string,
  password: string,
): Promise<number> {
  const trimmed = identifier.trim();
  const [user] = await requireDb()
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(or(eq(users.email, trimmed.toLowerCase()), eq(users.phone, trimmed)))
    .limit(1);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new IdentityError(
      "INVALID_CREDENTIALS",
      "Invalid email/phone or password.",
    );
  }
  if (
    user.role === UserRole.Specialist &&
    user.status === UserStatus.Rejected
  ) {
    throw new IdentityError(
      "REJECTED_SPECIALIST",
      "Specialist application was rejected.",
    );
  }
  return user.id;
}

export interface ClientProfileInput {
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
}

// Only the profile's owner may edit it.
export async function updateClientProfile(
  actor: Actor | null,
  userId: number,
  input: ClientProfileInput,
): Promise<void> {
  if (!actor) {
    throw new IdentityError("UNAUTHENTICATED", "Sign in required.");
  }
  if (!can(actor, "profile.update", { clientId: userId, specialistId: null })) {
    throw new IdentityError("FORBIDDEN", "Only the owner can edit a profile.");
  }
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();

  await requireDb().transaction(async (tx) => {
    await assertContactFree(tx, email, phone, userId);
    await tx
      .update(users)
      .set({
        name: input.name.trim(),
        email,
        phone,
        propertyAddress: input.propertyAddress.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    await enqueueEvent(tx, {
      type: "account.profile_updated",
      payload: { userId },
    });
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

const RESET_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
const RESET_REQUEST_WINDOW_MS = 60 * 60 * 1000;
const RESET_REQUESTS_PER_WINDOW = 3;

// Emails the account holder a one-time link. Resolves the same way whether
// or not the email has an account or the limit is reached, so a caller
// cannot tell which emails are registered.
export async function requestPasswordReset(
  email: string,
  now: Date = new Date(),
): Promise<void> {
  await requireDb().transaction(async (tx) => {
    // The row lock makes concurrent requests for one user count each other.
    const [user] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .for("update");
    if (!user) return;

    await tx
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          lte(passwordResetTokens.expiresAt, now),
        ),
      );
    const [recent] = await tx
      .select({ n: count() })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          gt(
            passwordResetTokens.createdAt,
            new Date(now.getTime() - RESET_REQUEST_WINDOW_MS),
          ),
        ),
      );
    if (recent.n >= RESET_REQUESTS_PER_WINDOW) return;

    // A newer link replaces any earlier unused one.
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );
    const token = randomBytes(32).toString("base64url");
    await tx.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
      createdAt: now,
    });
    // The worker needs the raw token to build the link; the outbox drops
    // `secrets` once the email is out.
    await enqueueEvent(tx, {
      type: "password.reset_requested",
      payload: { userId: user.id, secrets: { token } },
    });
  });
}

// A link can be used while it is known, unused and not expired.
function usableLink(token: string, now: Date) {
  return and(
    eq(passwordResetTokens.tokenHash, hashSessionToken(token)),
    isNull(passwordResetTokens.usedAt),
    gt(passwordResetTokens.expiresAt, now),
  );
}

export async function isPasswordResetTokenValid(
  token: string,
  now: Date = new Date(),
): Promise<boolean> {
  const [row] = await requireDb()
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(usableLink(token, now));
  return Boolean(row);
}

// Sets the new password, spends the link and signs the user out everywhere.
// Only the password changes: role and status stay as they are.
export async function resetPassword(
  token: string,
  passwordHash: string,
  now: Date = new Date(),
): Promise<void> {
  await requireDb().transaction(async (tx) => {
    const [link] = await tx
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
      })
      .from(passwordResetTokens)
      .where(usableLink(token, now))
      .for("update");
    if (!link) {
      throw new IdentityError("INVALID_TOKEN", "Reset link is not valid.");
    }
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, link.id));
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: now })
      .where(eq(users.id, link.userId));
    await tx.delete(sessions).where(eq(sessions.userId, link.userId));
    await enqueueEvent(tx, {
      type: "password.reset_completed",
      payload: { userId: link.userId },
    });
  });
}
