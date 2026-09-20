import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { BookingButton } from "@/features/bookings/booking-button";
import { RequestList } from "@/features/requests/request-list";

export const metadata: Metadata = { title: "Моите заявки" };

export default function RequestsPage() {
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
        <RequestList actions />
      </div>
    </>
  );
}
