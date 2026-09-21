import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { BookingButton } from "@/features/bookings/booking-button";
import { RequestList } from "@/features/requests/request-list";
import { findClientRequests } from "@/features/requests/server/queries";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = { title: "Моите заявки" };
export const dynamic = "force-dynamic";

export default async function ClientRequestsPage() {
  const user = await getServerSession();
  if (isDbConfigured && !user) {
    redirect("/login");
  }

  const initialRequests = user ? await findClientRequests(user.id) : null;

  return (
    <>
      <PageHeading
        eyebrow="ВСИЧКО НА ЕДНО МЯСТО"
        title="Моите заявки"
        description="Следете текущите услуги и разглеждайте историята си."
      >
        <BookingButton />
      </PageHeading>
      <div className="card">
        <RequestList actions initialRequests={initialRequests} />
      </div>
    </>
  );
}
