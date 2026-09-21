import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { BookingButton } from "@/features/bookings/booking-button";

export const metadata: Metadata = { title: "Табло на клиента" };

export default function ClientDashboardPage() {
  return (
    <>
      <PageHeading
        eyebrow="ТАБЛО НА КЛИЕНТА"
        title="Спокойствие и грижа за вашия дом"
        description="Следете активните си заявки, планирайте нови услуги и управлявайте вашия абонамент."
      >
        <BookingButton />
      </PageHeading>
      <div className="card">
        <p>Добре дошли във вашия клиентски панел на DOMORA.</p>
      </div>
    </>
  );
}
