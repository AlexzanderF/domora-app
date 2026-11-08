import { cache } from "react";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { sessions } from "@/db/schema";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "../constants";
import type { User } from "../types";
import { findUserBySessionToken } from "./queries";
import { hashSessionToken } from "./token";

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE };

async function isSecureCookie(): Promise<boolean> {
  if (process.env.COOKIE_SECURE === "false") {
    return false;
  }
  if (process.env.COOKIE_SECURE === "true") {
    return true;
  }
  try {
    const headerList = await headers();
    const proto = headerList.get("x-forwarded-proto");
    if (proto) {
      return proto.toLowerCase() === "https";
    }
    const origin = headerList.get("origin") || headerList.get("referer");
    if (origin) {
      return origin.startsWith("https://");
    }
  } catch {
    // Fallback when headers are unavailable
  }
  return process.env.NODE_ENV === "production";
}

// The one place a session cookie is resolved to a user (role and status read
// from the DB), cached per request.
export const getServerSession = cache(async (): Promise<User | null> => {
  if (!isDbConfigured) {
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
});

export async function createSession(userId: number): Promise<string | null> {
  if (!isDbConfigured) return null;
  const db = getDb();
  if (!db) return null;

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await db.insert(sessions).values({
    userId,
    token: hashSessionToken(token),
    expiresAt,
  });

  const isSecure = await isSecureCookie();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
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
        await db
          .delete(sessions)
          .where(eq(sessions.token, hashSessionToken(token)));
      }
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
    // Clear the legacy role/status cookies left by earlier versions.
    cookieStore.delete("domora_role");
    cookieStore.delete("domora_status");
  } catch {
    // Gracefully handle deletion in static or non-request environments
  }
}
