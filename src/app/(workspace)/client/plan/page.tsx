import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { ClientPlanView } from "@/features/subscriptions/client-plan-view";
import { findUserSubscription } from "@/features/subscriptions/server/queries";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";
import type { Subscription } from "@/features/subscriptions/types";

export const metadata: Metadata = { title: "Моят абонамент" };
export const dynamic = "force-dynamic";

export default async function ClientPlanPage() {
  const user = await getServerSession();
  const canManageSubscriptions = isDbConfigured && Boolean(user);
  let initialSubscription: Subscription | null = null;
  let loadError: string | undefined;

  if (canManageSubscriptions && user) {
    try {
      initialSubscription = await findUserSubscription(user.id);
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
