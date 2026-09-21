import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { ClientPlanView } from "@/features/subscriptions/client-plan-view";
import { findUserSubscription } from "@/features/subscriptions/server/queries";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = { title: "Моят абонамент" };
export const dynamic = "force-dynamic";

export default async function ClientPlanPage() {
  const user = await getServerSession();
  const initialSubscription =
    isDbConfigured && user ? await findUserSubscription(user.id) : null;

  return (
    <>
      <PageHeading
        eyebrow="АБОНАМЕНТЕН ПЛАН"
        title="Моят абонамент"
        description="Управлявайте своя месечен абонамент за профилактика и поддръжка или изберете нов план."
      />
      <ClientPlanView
        initialSubscription={initialSubscription}
        isDbMode={isDbConfigured && Boolean(user)}
      />
    </>
  );
}
