import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { RequestList } from "@/features/requests/request-list";
import { listAll } from "@/domain/requests";
import { presentAdminRequest } from "@/features/requests/presenter";
import { findSpecialistApplications } from "@/features/admin/server/queries";
import { getActor } from "@/features/auth/server/actor";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Всички заявки · Администрация DOMORA",
  description:
    "Пълен регистър на клиентските заявки в платформата DOMORA с детайли и възможност за управление.",
};
export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const actor = isDbConfigured ? await getActor() : null;

  const [initialRequests, specialists] = await Promise.all([
    actor ? listAll(actor).then((r) => r.map(presentAdminRequest)) : null,
    findSpecialistApplications(),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="АДМИНИСТРАЦИЯ"
        title="Всички заявки"
        description="Преглед и филтриране на всички клиентски заявки за услуги в платформата."
      />
      <Card>
        <RequestList
          actions
          initialRequests={initialRequests ?? []}
          specialists={specialists ?? []}
        />
      </Card>
    </>
  );
}
