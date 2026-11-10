import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { BookingButton } from "@/features/bookings/booking-button";
import { RequestList } from "@/features/requests/request-list";
import { findClientRequests } from "@/features/requests/server/queries";
import { getServerSession } from "@/features/auth/server/session";

export const metadata: Metadata = { title: "Моите заявки" };
export const dynamic = "force-dynamic";

export default async function ClientRequestsPage() {
  const user = await getServerSession();
  if (!user) redirect("/api/auth/logout?next=/login");

  const initialRequests = (await findClientRequests(user)) ?? [];

  return (
    <>
      <PageHeading
        eyebrow="ВСИЧКО НА ЕДНО МЯСТО"
        title="Моите заявки"
        description="Следете текущите услуги и разглеждайте историята си."
      >
        <BookingButton />
      </PageHeading>
      <Card>
        <RequestList actions initialRequests={initialRequests} />
      </Card>
    </>
  );
}
