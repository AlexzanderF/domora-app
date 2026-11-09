"use server";

import { revalidatePath } from "next/cache";
import { isDbConfigured } from "@/db";
import { RequestError, startSubscription } from "@/domain/requests";
import {
  SubscriptionError,
  cancelSubscription,
  createSubscription,
} from "@/domain/subscriptions";
import type { SubscriptionErrorCode } from "@/domain/subscriptions";
import { getActor } from "@/features/auth/server/actor";
import type { Subscription, SubscriptionPlan } from "../types";

export interface SubscribeInput {
  planType: SubscriptionPlan;
  propertyAddress: string;
  propertyArea: number;
  visitsPerMonth?: number;
}

export interface StartSubscriptionInput extends SubscribeInput {
  visitsPerMonth: number;
  // The first visit, booked against the new subscription.
  firstVisit: {
    service: string;
    description: string;
    date: string;
    time: string;
    // Price of that one visit.
    price: number;
  };
}

export interface SubscriptionActionResult {
  success: boolean;
  error?: string;
  // "demo" means there is no database or session; nothing was saved.
  mode?: "db" | "demo";
  subscription?: Subscription;
}

// Subscription visits are booked under the general-maintenance category.
const SUBSCRIPTION_CATEGORY = 4;

const UNAVAILABLE =
  "Абонаментите са временно недостъпни. Опитайте отново по-късно.";

const ERRORS: Record<SubscriptionErrorCode, string> = {
  UNAUTHENTICATED: "Влезте в профила си, за да управлявате абонамент.",
  FORBIDDEN: "Само клиенти могат да имат абонамент.",
  INVALID_INPUT: "Моля, въведете валиден адрес и размер на имота.",
};

function revalidateSubscriptionPages(): void {
  revalidatePath("/client/plan");
  revalidatePath("/client/requests");
  revalidatePath("/client");
}

function failure(error: unknown): SubscriptionActionResult {
  if (error instanceof SubscriptionError) {
    return { success: false, error: ERRORS[error.code] };
  }
  if (error instanceof RequestError) {
    return {
      success: false,
      error:
        error.code === "INVALID_INPUT"
          ? "Моля, проверете датата, часовия диапазон и бележките."
          : "Абонаментът не можа да бъде създаден. Опитайте отново.",
    };
  }
  throw error;
}

export async function createSubscriptionAction(
  input: SubscribeInput,
): Promise<SubscriptionActionResult> {
  if (!isDbConfigured) return { success: false, error: UNAVAILABLE };

  try {
    const subscription = await createSubscription(await getActor(), input);
    revalidateSubscriptionPages();
    return { success: true, mode: "db", subscription };
  } catch (error) {
    return failure(error);
  }
}

// The plans configurator: saves the subscription, then books the first visit
// against it. Without a database or session it only reports demo mode, so the
// configurator can fall back to its in-memory request.
export async function startSubscriptionAction(
  input: StartSubscriptionInput,
): Promise<SubscriptionActionResult> {
  if (!isDbConfigured) return { success: true, mode: "demo" };
  const actor = await getActor();
  if (!actor) return { success: true, mode: "demo" };

  try {
    const { firstVisit, ...plan } = input;
    const { subscription } = await startSubscription(actor, plan, {
      category: SUBSCRIPTION_CATEGORY,
      service: firstVisit.service,
      description: firstVisit.description,
      address: input.propertyAddress,
      price: firstVisit.price,
      scheduledDate: firstVisit.date,
      scheduledTime: firstVisit.time,
    });
    revalidateSubscriptionPages();
    return { success: true, mode: "db", subscription };
  } catch (error) {
    return failure(error);
  }
}

export async function cancelSubscriptionAction(): Promise<SubscriptionActionResult> {
  if (!isDbConfigured) return { success: false, error: UNAVAILABLE };

  try {
    await cancelSubscription(await getActor());
    revalidateSubscriptionPages();
    return { success: true, mode: "db" };
  } catch (error) {
    return failure(error);
  }
}
