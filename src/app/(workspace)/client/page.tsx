import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { BookingButton } from "@/features/bookings/booking-button";
import { ClientDashboard } from "@/features/client-dashboard/client-dashboard";
import { findClientRequests } from "@/features/requests/server/queries";
import { findUserSubscription } from "@/features/subscriptions/server/queries";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = { title: "Табло на клиента" };

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const user = await getServerSession();
  const [initialRequests, initialSubscription] = user
    ? await Promise.all([
        findClientRequests(user.id),
        findUserSubscription(user.id),
      ])
    : [null, null];

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
        initialRequests={initialRequests}
        initialSubscription={initialSubscription}
        isDbMode={isDbConfigured && Boolean(user)}
      />
    </>
  );
}
