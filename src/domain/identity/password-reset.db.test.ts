import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  notificationDeliveries,
  outboxEvents,
  passwordResetTokens,
  requireDb,
  sessions,
  users,
} from "@/db";
import { MAX_ATTEMPTS, backoffMs, processOutbox } from "@/domain/notifications";
import { accountFlowHandlers } from "@/domain/notifications/account-flow";
import type {
  Notifier,
  NotificationMessage,
} from "@/domain/notifications/notifier";
import { renderTemplate } from "@/domain/notifications/templates";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { hashSessionToken } from "@/features/auth/server/token";
import { createActor } from "../../../tests/db/factories";
import {
  isPasswordResetTokenValid,
  requestPasswordReset,
  resetPassword,
} from "./index";

const T0 = new Date("2026-01-01T10:00:00Z");
const HOUR = 60 * 60 * 1000;
const after = (ms: number) => new Date(T0.getTime() + ms);

async function createUser(
  role: UserRole = UserRole.Client,
  status: UserStatus = UserStatus.Active,
): Promise<{ id: number; email: string }> {
  const { id } = await createActor(role, status);
  const [row] = await requireDb()
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, id));
  return { id, email: row.email };
}

// Runs the worker step and returns the emails it sent.
async function sendMail(
  now = T0,
  fail = false,
): Promise<NotificationMessage[]> {
  const sent: NotificationMessage[] = [];
  const notifier: Notifier = {
    async send(message) {
      if (fail) throw new Error("smtp down");
      sent.push(message);
    },
  };
  await processOutbox({ notifier, handlers: accountFlowHandlers, now });
  return sent;
}

function tokenIn(message: NotificationMessage): string {
  const { url } = message.data.secrets as { url: string };
  const token = new URL(url).searchParams.get("token");
  if (!token) throw new Error("No token in the reset link.");
  return token;
}

// Requests a link and returns the token from the email the user receives.
async function requestToken(email: string, now = T0): Promise<string> {
  await requestPasswordReset(email, now);
  const [message] = await sendMail(now);
  return tokenIn(message);
}

async function passwordHashOf(userId: number) {
  const [row] = await requireDb()
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId));
  return row.passwordHash;
}

async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (error: { code?: string }) => error.code ?? "UNKNOWN",
  );
}

describe("requestPasswordReset", () => {
  it("emails a registered user a Bulgarian message with a reset link", async () => {
    const user = await createUser();
    await requestPasswordReset(user.email, T0);
    const sent = await sendMail();

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: user.email,
      template: "password-reset",
    });
    const { url } = sent[0].data.secrets as { url: string };
    expect(url).toContain("/reset-password?token=");
    const { subject, text, html } = renderTemplate(
      sent[0].template,
      sent[0].data,
    );
    expect(subject).toBe("Смяна на паролата в DOMORA");
    expect(text).toContain(url);
    expect(html).toContain("token=");
  });

  it("finds the account whatever the letter case of the email", async () => {
    const user = await createUser();
    await requestPasswordReset(`  ${user.email.toUpperCase()} `, T0);
    expect(await sendMail()).toHaveLength(1);
  });

  it("does nothing, quietly, for an unknown email", async () => {
    await requestPasswordReset("nobody@example.com", T0);
    expect(await requireDb().select().from(outboxEvents)).toHaveLength(0);
    expect(await requireDb().select().from(passwordResetTokens)).toHaveLength(
      0,
    );
  });

  it("stores only a hash of the token", async () => {
    const user = await createUser();
    const token = await requestToken(user.email);
    const rows = await requireDb().select().from(passwordResetTokens);
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(hashSessionToken(token));
    expect(JSON.stringify(rows)).not.toContain(token);
  });

  it("replaces an earlier unused link with the newer one", async () => {
    const user = await createUser();
    const first = await requestToken(user.email, T0);
    const second = await requestToken(user.email, after(60_000));

    expect(await isPasswordResetTokenValid(first, after(120_000))).toBe(false);
    expect(await rejection(resetPassword(first, "new", after(120_000)))).toBe(
      "INVALID_TOKEN",
    );
    expect(await isPasswordResetTokenValid(second, after(120_000))).toBe(true);
  });

  it("sends at most 3 emails per address in any hour", async () => {
    const user = await createUser();
    await requestToken(user.email, T0);
    await requestToken(user.email, after(10 * 60_000));
    const third = await requestToken(user.email, after(20 * 60_000));

    await requestPasswordReset(user.email, after(59 * 60_000));
    expect(await sendMail(after(59 * 60_000))).toHaveLength(0);
    // The request over the limit leaves the last link working.
    expect(await isPasswordResetTokenValid(third, after(59 * 60_000))).toBe(
      true,
    );

    // The first request is now over an hour old.
    await requestPasswordReset(user.email, after(HOUR + 60_000));
    expect(await sendMail(after(HOUR + 60_000))).toHaveLength(1);
  });

  it("does not count other users towards the limit", async () => {
    const user = await createUser();
    const other = await createUser();
    for (let i = 0; i < 3; i += 1) await requestToken(user.email, T0);
    await requestPasswordReset(other.email, T0);
    expect(await sendMail()).toHaveLength(1);
  });

  it.each([
    [UserRole.Client, UserStatus.Active],
    [UserRole.Admin, UserStatus.Active],
    [UserRole.Specialist, UserStatus.Active],
    [UserRole.Specialist, UserStatus.Pending],
    [UserRole.Specialist, UserStatus.Rejected],
  ])("works for %s (%s) without changing access", async (role, status) => {
    const user = await createUser(role, status);
    const token = await requestToken(user.email);
    await resetPassword(token, "new-hash", T0);

    const [row] = await requireDb()
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(row).toMatchObject({ passwordHash: "new-hash", role, status });
  });
});

describe("the raw token after the email", () => {
  it("is gone from the outbox and the delivery once sent", async () => {
    const user = await createUser();
    const token = await requestToken(user.email);

    const stored = JSON.stringify([
      await requireDb().select().from(outboxEvents),
      await requireDb().select().from(notificationDeliveries),
    ]);
    expect(stored).not.toContain(token);
    expect(stored).not.toContain("secrets");
  });

  it("is gone from a delivery the worker gave up on", async () => {
    const user = await createUser();
    await requestPasswordReset(user.email, T0);
    let now = T0;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      await sendMail(now, true);
      now = new Date(now.getTime() + backoffMs(attempt));
    }

    const [delivery] = await requireDb().select().from(notificationDeliveries);
    expect(delivery.status).toBe("FAILED");
    expect(JSON.stringify(delivery)).not.toContain("secrets");
  });

  it("is kept while a failed send is still being retried", async () => {
    const user = await createUser();
    await requestPasswordReset(user.email, T0);
    await sendMail(T0, true);
    const [message] = await sendMail(after(backoffMs(1)));
    expect(await isPasswordResetTokenValid(tokenIn(message), T0)).toBe(true);
  });
});

describe("resetPassword", () => {
  it("sets the new password and revokes every session of the user", async () => {
    const user = await createUser();
    const other = await createUser();
    await requireDb()
      .insert(sessions)
      .values([
        { userId: user.id, token: "a", expiresAt: after(HOUR) },
        { userId: user.id, token: "b", expiresAt: after(HOUR) },
        { userId: other.id, token: "c", expiresAt: after(HOUR) },
      ]);
    const token = await requestToken(user.email);

    await resetPassword(token, "new-hash", T0);

    expect(await passwordHashOf(user.id)).toBe("new-hash");
    expect(await passwordHashOf(other.id)).toBe("x");
    const left = await requireDb().select().from(sessions);
    expect(left.map((s) => s.token)).toEqual(["c"]);
  });

  it("accepts a link only once", async () => {
    const user = await createUser();
    const token = await requestToken(user.email);
    await resetPassword(token, "first", T0);

    expect(await isPasswordResetTokenValid(token, T0)).toBe(false);
    expect(await rejection(resetPassword(token, "second", T0))).toBe(
      "INVALID_TOKEN",
    );
    expect(await passwordHashOf(user.id)).toBe("first");
  });

  it("rejects a link after 48 hours and changes nothing", async () => {
    const user = await createUser();
    await requireDb()
      .insert(sessions)
      .values({ userId: user.id, token: "a", expiresAt: after(100 * HOUR) });
    const token = await requestToken(user.email);

    expect(await isPasswordResetTokenValid(token, after(48 * HOUR - 1))).toBe(
      true,
    );
    expect(await isPasswordResetTokenValid(token, after(48 * HOUR))).toBe(
      false,
    );
    expect(await rejection(resetPassword(token, "new", after(48 * HOUR)))).toBe(
      "INVALID_TOKEN",
    );
    expect(await passwordHashOf(user.id)).toBe("x");
    expect(await requireDb().select().from(sessions)).toHaveLength(1);
  });

  it("rejects an unknown link", async () => {
    expect(await isPasswordResetTokenValid("nope", T0)).toBe(false);
    expect(await rejection(resetPassword("nope", "new", T0))).toBe(
      "INVALID_TOKEN",
    );
  });
});
