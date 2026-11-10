"use server";

import { startSubscription } from "@/domain/requests";
import { findTariffs } from "@/domain/pricing/tariffs";
import type { Tariffs } from "@/domain/requests/types";
import { cancelSubscription, createSubscription } from "@/domain/subscriptions";
import { PRICE_CHANGED_MESSAGE, runAction } from "@/lib/server/action";
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
  };
  // The plan total the configurator displayed; the server re-quotes it.
  expectedPrice: number;
}

export type SubscriptionActionResult = ActionResult<Subscription> & {
  // Fresh Tariffs, sent when the quoted price was stale so the client re-quotes.
  tariffs?: Tariffs;
};

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
  const result = await runAction({
    messages: MESSAGES,
    revalidate: ["subscriptions"],
    run: async (actor) => {
      const { firstVisit, expectedPrice, ...plan } = input;
      const { subscription } = await startSubscription(actor, plan, {
        service: firstVisit.service,
        description: firstVisit.description,
        address: input.propertyAddress,
        expectedPrice,
        scheduledDate: firstVisit.date,
        scheduledTime: firstVisit.time,
      });
      return subscription;
    },
  });
  return !result.success && result.error === PRICE_CHANGED_MESSAGE
    ? { ...result, tariffs: await findTariffs() }
    : result;
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
