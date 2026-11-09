import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { BookingButton } from "@/features/bookings/booking-button";
import { ClientDashboard } from "@/features/client-dashboard/client-dashboard";
import { findClientRequests } from "@/features/requests/server/queries";
import { findUserSubscription } from "@/features/subscriptions/server/queries";
import { getServerSession } from "@/features/auth/server/session";

export const metadata: Metadata = { title: "Табло на клиента" };

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const user = await getServerSession();
  if (!user) redirect("/api/auth/logout?next=/login");
  const [initialRequests, initialSubscription] = await Promise.all([
    findClientRequests(user.id),
    findUserSubscription(user),
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
        requests={initialRequests ?? []}
        subscription={initialSubscription}
      />
    </>
  );
}
