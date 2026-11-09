import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { FailedDeliveriesList } from "@/features/admin/failed-deliveries-list";
import { findFailedDeliveries } from "@/features/admin/server/failed-deliveries";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Неуспешни известия · Администрация DOMORA",
  description:
    "Известия, които не са изпратени след всички опити, за ръчно проследяване.",
};
export const dynamic = "force-dynamic";

// Admin-only: the admin layout enforces the role.
export default async function AdminNotificationsPage() {
  const deliveries = isDbConfigured ? await findFailedDeliveries() : [];

  return (
    <>
      <PageHeading
        eyebrow="АДМИНИСТРАЦИЯ"
        title="Неуспешни известия"
        description="Известия, които не са изпратени след всички опити. Проследете ги ръчно."
      />
      <FailedDeliveriesList deliveries={deliveries} />
    </>
  );
}
