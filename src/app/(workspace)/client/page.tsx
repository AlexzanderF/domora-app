import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { BookingButton } from "@/features/bookings/booking-button";
import { ClientDashboard } from "@/features/client-dashboard/client-dashboard";
import { isDbConfigured } from "@/db";
import { listClientRequests } from "@/domain/requests";
import { presentClientRequest } from "@/features/requests/presenter";
import { findUserSubscription } from "@/features/subscriptions/server/queries";
import { getActor } from "@/features/auth/server/actor";

export const metadata: Metadata = { title: "Табло на клиента" };

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const actor = isDbConfigured ? await getActor() : null;
  const [initialRequests, initialSubscription] = await Promise.all([
    actor
      ? listClientRequests(actor).then((list) => list.map(presentClientRequest))
      : [],
    actor ? findUserSubscription(actor) : null,
  ]);

  return (
    <>
      <PageHeading
        eyebrow="ТАБЛО НА КЛИЕНТА"
        title="Спокойствие и грижа за вашия дом"
        description="Следете активните си заявки, планирайте нови услуги и управлявайте вашия абонамент."
      >
        <BookingButton />
      </PageHeading>
      <ClientDashboard
        requests={initialRequests}
        subscription={initialSubscription}
      />
    </>
  );
}
