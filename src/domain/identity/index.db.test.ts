import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { requireDb, sessions, users } from "@/db";
import { can } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/features/auth/types";
import { findUserBySessionToken } from "@/features/auth/server/queries";
import { hashSessionToken } from "@/features/auth/server/token";
import { createActor } from "../../../tests/db/factories";
import {
  bootstrapAdmin,
  registerSpecialist,
  setSpecialistStatus,
} from "./index";

const profile = {
  category: "ВиК",
  area: "София",
  experienceYears: 5,
  bio: "Опитен майстор",
};

async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (error: { code?: string }) => error.code ?? "UNKNOWN",
  );
}

async function statusOf(userId: number) {
  const [row] = await requireDb()
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, userId));
  return row.status;
}

async function signUp(email = "spec@example.com") {
  return registerSpecialist({
    name: "Мартин Колев",
    email,
    phone: "0888111222",
    passwordHash: "hash",
    profile,
  });
}

describe("registerSpecialist", () => {
  it("creates a Pending specialist with a profile", async () => {
    const userId = await signUp();

    expect(await statusOf(userId)).toBe(UserStatus.Pending);
    const [row] = await requireDb()
      .select()
      .from(users)
      .where(eq(users.id, userId));
    expect(row.role).toBe(UserRole.Specialist);
  });

  it("stores nothing when the profile insert fails", async () => {
    const outcome = await rejection(
      registerSpecialist({
        name: "Мартин Колев",
        email: "broken@example.com",
        phone: "0888111222",
        passwordHash: "hash",
        profile: { ...profile, category: null as unknown as string },
      }),
    );

    expect(outcome).not.toBeNull();
    expect(await requireDb().select().from(users)).toHaveLength(0);
  });
});

describe("setSpecialistStatus", () => {
  it("lets an admin approve and reject, in either direction", async () => {
    const admin = await createActor(UserRole.Admin);
    const userId = await signUp();

    await setSpecialistStatus(admin, userId, UserStatus.Active);
    expect(await statusOf(userId)).toBe(UserStatus.Active);

    await setSpecialistStatus(admin, userId, UserStatus.Rejected);
    expect(await statusOf(userId)).toBe(UserStatus.Rejected);

    await setSpecialistStatus(admin, userId, UserStatus.Active);
    expect(await statusOf(userId)).toBe(UserStatus.Active);
  });

  it("never sends a specialist back to Pending", async () => {
    const admin = await createActor(UserRole.Admin);
    const userId = await signUp();

    expect(
      await rejection(setSpecialistStatus(admin, userId, UserStatus.Pending)),
    ).toBe("INVALID_INPUT");
    expect(await statusOf(userId)).toBe(UserStatus.Pending);
  });

  it("only works on specialists", async () => {
    const admin = await createActor(UserRole.Admin);
    const client = await createActor(UserRole.Client);

    expect(
      await rejection(setSpecialistStatus(admin, client.id, UserStatus.Active)),
    ).toBe("NOT_FOUND");
    expect(
      await rejection(setSpecialistStatus(admin, 99999, UserStatus.Active)),
    ).toBe("NOT_FOUND");
  });

  it("rejects everyone who is not an admin", async () => {
    const userId = await signUp();
    const client = await createActor(UserRole.Client);
    const self = await createActor(UserRole.Specialist, UserStatus.Pending);

    expect(
      await rejection(setSpecialistStatus(null, userId, UserStatus.Active)),
    ).toBe("UNAUTHENTICATED");
    expect(
      await rejection(setSpecialistStatus(client, userId, UserStatus.Active)),
    ).toBe("FORBIDDEN");
    expect(
      await rejection(setSpecialistStatus(self, self.id, UserStatus.Active)),
    ).toBe("FORBIDDEN");
    expect(await statusOf(userId)).toBe(UserStatus.Pending);
  });

  it("takes effect on the next request without re-login", async () => {
    const admin = await createActor(UserRole.Admin);
    const userId = await signUp();
    const token = "session-token";
    await requireDb()
      .insert(sessions)
      .values({
        userId,
        token: hashSessionToken(token),
        expiresAt: new Date(Date.now() + 60_000),
      });

    const before = await findUserBySessionToken(token);
    expect(before?.status).toBe(UserStatus.Pending);
    expect(
      can(
        { id: userId, role: UserRole.Specialist, status: before!.status },
        "request.claim",
        {
          clientId: 1,
          specialistId: null,
        },
      ),
    ).toBe(false);

    await setSpecialistStatus(admin, userId, UserStatus.Active);

    const after = await findUserBySessionToken(token);
    expect(after?.status).toBe(UserStatus.Active);
    expect(
      can(
        { id: userId, role: UserRole.Specialist, status: after!.status },
        "request.claim",
        {
          clientId: 1,
          specialistId: null,
        },
      ),
    ).toBe(true);

    await setSpecialistStatus(admin, userId, UserStatus.Rejected);
    expect((await findUserBySessionToken(token))?.status).toBe(
      UserStatus.Rejected,
    );
  });
});

describe("bootstrapAdmin", () => {
  const input = {
    name: "Първи админ",
    email: "Owner@Example.com",
    phone: "0899000111",
    passwordHash: "hash",
  };

  it("creates the first Active admin", async () => {
    expect(await bootstrapAdmin(input)).toEqual({ created: true });

    const [row] = await requireDb().select().from(users);
    expect(row).toMatchObject({
      email: "owner@example.com",
      role: UserRole.Admin,
      status: UserStatus.Active,
    });
  });

  it("is a no-op once an admin exists", async () => {
    await createActor(UserRole.Admin);

    expect(await bootstrapAdmin(input)).toEqual({ created: false });
    expect(await requireDb().select().from(users)).toHaveLength(1);
  });

  it("can be run twice safely", async () => {
    await bootstrapAdmin(input);
    expect(await bootstrapAdmin(input)).toEqual({ created: false });
    expect(await requireDb().select().from(users)).toHaveLength(1);
  });
});
