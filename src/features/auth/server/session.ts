import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { sessions } from "@/db/schema";
import type { User } from "../types";
import { findUserBySessionToken } from "./queries";

export const SESSION_COOKIE_NAME = "domora_session";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function getServerSession(): Promise<User | null> {
  if (process.env.NEXT_STATIC_EXPORT === "1" || !isDbConfigured) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    return await findUserBySessionToken(token);
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<string | null> {
  if (!isDbConfigured) return null;
  const db = getDb();
  if (!db) return null;

  const token = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    token,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    expires: expiresAt,
  });

  return token;
}

export async function deleteSession(): Promise<void> {
  if (!isDbConfigured) return;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const db = getDb();
      if (db) {
        await db.delete(sessions).where(eq(sessions.token, token));
      }
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Gracefully handle deletion in static or non-request environments
  }
}
