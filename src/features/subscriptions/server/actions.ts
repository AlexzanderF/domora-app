"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { subscriptions } from "@/db/schema";
import { getServerSession } from "@/features/auth/server/session";
import type { Subscription, SubscriptionPlan } from "../types";

export interface SubscribeInput {
  planType: SubscriptionPlan;
  propertyAddress: string;
  propertyArea: number;
}

export interface SubscriptionActionResult {
  success: boolean;
  error?: string;
  subscription?: Subscription;
}

export async function createSubscriptionAction(
  input: SubscribeInput,
): Promise<SubscriptionActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return {
      success: false,
      error: "Абонаментите са временно недостъпни. Опитайте отново по-късно.",
    };
  }

  const user = await getServerSession();
  if (!user) {
    return {
      success: false,
      error: "Влезте в профила си, за да управлявате абонамент.",
    };
  }

  const address = input.propertyAddress.trim();
  const area = Number(input.propertyArea);
  if (!address || !Number.isInteger(area) || area < 1 || area > 1000) {
    return {
      success: false,
      error: "Моля, въведете валиден адрес и размер на имота.",
    };
  }

  const db = getDb();
  if (!db) {
    return { success: false, error: "Грешка при връзка с базата данни." };
  }

  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const visitsRemaining = input.planType === "HOME" ? 2 : 4;

  const [created] = await db
    .insert(subscriptions)
    .values({
      userId: user.id,
      planType: input.planType,
      propertyAddress: address,
      propertyArea: area,
      status: "ACTIVE",
      visitsRemaining,
      validUntil,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        planType: input.planType,
        propertyAddress: address,
        propertyArea: area,
        status: "ACTIVE",
        visitsRemaining,
        validUntil,
        updatedAt: new Date(),
      },
    })
    .returning();

  revalidatePath("/client/plan");
  revalidatePath("/client");

  return {
    success: true,
    subscription: {
      id: created.id,
      userId: created.userId,
      planType: created.planType,
      propertyAddress: created.propertyAddress,
      propertyArea: created.propertyArea,
      status: created.status,
      visitsRemaining: created.visitsRemaining,
      validUntil: created.validUntil.toISOString(),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    },
  };
}

export async function cancelSubscriptionAction(): Promise<SubscriptionActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return {
      success: false,
      error: "Абонаментите са временно недостъпни. Опитайте отново по-късно.",
    };
  }

  const user = await getServerSession();
  if (!user) {
    return {
      success: false,
      error: "Влезте в профила си, за да управлявате абонамент.",
    };
  }

  const db = getDb();
  if (!db) {
    return { success: false, error: "Грешка при връзка с базата данни." };
  }

  await db
    .update(subscriptions)
    .set({
      status: "CANCELLED",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, user.id));

  revalidatePath("/client/plan");
  revalidatePath("/client");

  return { success: true };
}
