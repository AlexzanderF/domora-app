import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { ClientPlanView } from "@/features/subscriptions/client-plan-view";
import { findUserSubscription } from "@/features/subscriptions/server/queries";
import { getActor } from "@/features/auth/server/actor";
import { isDbConfigured } from "@/db";
import type { Subscription } from "@/domain/subscriptions/types";

export const metadata: Metadata = { title: "Моят абонамент" };
export const dynamic = "force-dynamic";

export default async function ClientPlanPage() {
  const actor = isDbConfigured ? await getActor() : null;
  const canManageSubscriptions = Boolean(actor);
  let initialSubscription: Subscription | null = null;
  let loadError: string | undefined;

  if (actor) {
    try {
      initialSubscription = await findUserSubscription(actor);
    } catch {
      loadError =
        "Не успяхме да заредим данните за вашия абонамент. Опитайте отново по-късно.";
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="АБОНАМЕНТЕН ПЛАН"
        title="Моят абонамент"
        description="Управлявайте своя месечен абонамент за профилактика и поддръжка или изберете нов план."
      />
      <ClientPlanView
        initialSubscription={initialSubscription}
        canManageSubscriptions={canManageSubscriptions}
        loadError={loadError}
      />
    </>
  );
}
