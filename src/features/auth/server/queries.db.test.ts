import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { requireDb, sessions, users } from "@/db";
import { UserRole, UserStatus } from "../types";
import { findUserBySessionToken } from "./queries";
import { hashSessionToken } from "./token";

async function seedUser(role: UserRole, status: UserStatus) {
  const [user] = await requireDb()
    .insert(users)
    .values({
      name: "Test",
      email: "t@example.com",
      phone: "0888000000",
      passwordHash: "x",
      role,
      status,
    })
    .returning({ id: users.id });
  return user.id;
}

const inAnHour = () => new Date(Date.now() + 3_600_000);

describe("findUserBySessionToken (DB-backed)", () => {
  it("resolves a raw cookie token against its stored hash, with role and status from the DB", async () => {
    const userId = await seedUser(UserRole.Specialist, UserStatus.Pending);
    await requireDb()
      .insert(sessions)
      .values({
        userId,
        token: hashSessionToken("raw-token"),
        expiresAt: inAnHour(),
      });

    const user = await findUserBySessionToken("raw-token");
    expect(user?.id).toBe(userId);
    expect(user?.role).toBe(UserRole.Specialist);
    expect(user?.status).toBe(UserStatus.Pending);
  });

  it("does not accept the stored hash itself as a token", async () => {
    const userId = await seedUser(UserRole.Client, UserStatus.Active);
    const hash = hashSessionToken("raw-token");
    await requireDb()
      .insert(sessions)
      .values({ userId, token: hash, expiresAt: inAnHour() });

    expect(await findUserBySessionToken(hash)).toBeNull();
  });

  it("reflects a status change immediately", async () => {
    const userId = await seedUser(UserRole.Specialist, UserStatus.Pending);
    await requireDb()
      .insert(sessions)
      .values({ userId, token: hashSessionToken("t"), expiresAt: inAnHour() });
    await requireDb()
      .update(users)
      .set({ status: UserStatus.Active })
      .where(eq(users.id, userId));

    expect((await findUserBySessionToken("t"))?.status).toBe(UserStatus.Active);
  });

  it("ignores expired sessions", async () => {
    const userId = await seedUser(UserRole.Client, UserStatus.Active);
    await requireDb()
      .insert(sessions)
      .values({ userId, token: hashSessionToken("t"), expiresAt: new Date(0) });

    expect(await findUserBySessionToken("t")).toBeNull();
  });
});
