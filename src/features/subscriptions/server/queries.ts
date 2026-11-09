import { isDbConfigured } from "@/db";
import type { Actor } from "@/domain/authorization";
import { getCurrentSubscription } from "@/domain/subscriptions";
import { UserRole } from "@/features/auth/types";
import type { Subscription } from "../types";

// The client's active subscription, else their latest one. Null without a
// database or for anyone who is not a client.
export async function findUserSubscription(
  actor: Actor,
): Promise<Subscription | null> {
  if (!isDbConfigured || actor.role !== UserRole.Client) return null;
  return getCurrentSubscription(actor);
}
