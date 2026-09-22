import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { sessions } from "@/db/schema";
import {
  ROLE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  STATUS_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "../constants";
import type { User } from "../types";
import { findUserBySessionToken } from "./queries";

export {
  ROLE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  STATUS_COOKIE_NAME,
  SESSION_MAX_AGE,
};

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

export async function createSession(
  userId: number,
  role?: string,
  status?: string,
): Promise<string | null> {
  if (!isDbConfigured) return null;
  const db = getDb();
  if (!db) return null;

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  let userRole = role;
  let userStatus = status;

  if (!userRole || !userStatus) {
    const { users } = await import("@/db/schema");
    const [user] = await db
      .select({ role: users.role, status: users.status })
      .from(users)
      .where(eq(users.id, userId));
    if (user) {
      userRole = user.role;
      userStatus = user.status;
    }
  }

  await db.insert(sessions).values({
    userId,
    token,
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

  if (userRole) {
    cookieStore.set(ROLE_COOKIE_NAME, userRole, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: SESSION_MAX_AGE,
      expires: expiresAt,
    });
  }

  if (userStatus) {
    cookieStore.set(STATUS_COOKIE_NAME, userStatus, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: SESSION_MAX_AGE,
      expires: expiresAt,
    });
  }

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
    cookieStore.delete(ROLE_COOKIE_NAME);
    cookieStore.delete(STATUS_COOKIE_NAME);
  } catch {
    // Gracefully handle deletion in static or non-request environments
  }
}
