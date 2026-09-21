import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { subscriptions } from "@/db/schema";
import type { Subscription } from "../types";

export async function findUserSubscription(
  userId: string,
): Promise<Subscription | null> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return null;
  }

  const db = getDb();
  if (!db) return null;

  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    planType: row.planType,
    propertyAddress: row.propertyAddress,
    propertyArea: row.propertyArea,
    status: row.status,
    visitsRemaining: row.visitsRemaining,
    validUntil: row.validUntil.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
