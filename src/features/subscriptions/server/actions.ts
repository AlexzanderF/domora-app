"use server";

import { startSubscription } from "@/domain/requests";
import { cancelSubscription, createSubscription } from "@/domain/subscriptions";
import { runAction } from "@/lib/server/action";
import type { ActionResult } from "@/lib/server/action";
import type {
  Subscription,
  SubscriptionPlan,
} from "@/domain/subscriptions/types";

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

export type SubscriptionActionResult = ActionResult<Subscription>;

// Subscription visits are booked under the general-maintenance category.
const SUBSCRIPTION_CATEGORY = 4;

const MESSAGES = {
  UNAUTHENTICATED: "Влезте в профила си, за да управлявате абонамент.",
  FORBIDDEN: "Само клиенти могат да имат абонамент.",
  INVALID_INPUT:
    "Моля, проверете адреса, размера на имота, датата, часовия диапазон и бележките.",
  INVALID_STATE: "Абонаментът не можа да бъде създаден. Опитайте отново.",
  NO_DATABASE: "Абонаментите са временно недостъпни. Опитайте отново по-късно.",
};

export async function createSubscriptionAction(
  input: SubscribeInput,
): Promise<SubscriptionActionResult> {
  return runAction({
    messages: MESSAGES,
    revalidate: ["subscriptions"],
    run: (actor) => createSubscription(actor, input),
  });
}

// The plans configurator: saves the subscription, then books the first visit
// against it.
export async function startSubscriptionAction(
  input: StartSubscriptionInput,
): Promise<SubscriptionActionResult> {
  return runAction({
    messages: MESSAGES,
    revalidate: ["subscriptions"],
    run: async (actor) => {
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
      return subscription;
    },
  });
}

export async function cancelSubscriptionAction(): Promise<SubscriptionActionResult> {
  return runAction({
    messages: MESSAGES,
    revalidate: ["subscriptions"],
    run: async (actor) => {
      await cancelSubscription(actor);
    },
  });
}
