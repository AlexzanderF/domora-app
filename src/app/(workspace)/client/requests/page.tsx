import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { BookingButton } from "@/features/bookings/booking-button";
import { RequestList } from "@/features/requests/request-list";
import { isDbConfigured } from "@/db";
import { listClientRequests } from "@/domain/requests";
import { presentClientRequest } from "@/features/requests/presenter";
import { getActor } from "@/features/auth/server/actor";

export const metadata: Metadata = { title: "Моите заявки" };
export const dynamic = "force-dynamic";

export default async function ClientRequestsPage() {
  const actor = isDbConfigured ? await getActor() : null;
  const initialRequests = actor
    ? (await listClientRequests(actor)).map(presentClientRequest)
    : [];

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
