import { and, eq } from "drizzle-orm";
import { requests, users } from "@/db";
import { UserRole, UserStatus } from "@/features/auth/types";
import type { Tx } from "./index";

// Lookups shared by the event handlers that resolve who to email.

export const payloadOf = (event: { payload: unknown }) =>
  event.payload as Record<string, unknown>;

export async function loadRequest(tx: Tx, payload: Record<string, unknown>) {
  const [row] = await tx
    .select()
    .from(requests)
    .where(eq(requests.id, Number(payload.requestId)));
  return row;
}

export async function emailOf(
  tx: Tx,
  userId: number,
): Promise<string | undefined> {
  const [row] = await tx
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  return row?.email;
}

export async function nameOf(
  tx: Tx,
  userId: number,
): Promise<string | undefined> {
  const [row] = await tx
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId));
  return row?.name;
}

export async function adminEmails(tx: Tx): Promise<string[]> {
  const rows = await tx
    .select({ email: users.email })
    .from(users)
    .where(
      and(eq(users.role, UserRole.Admin), eq(users.status, UserStatus.Active)),
    );
  return rows.map((row) => row.email);
}
