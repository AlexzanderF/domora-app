import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { RequestList } from "@/features/requests/request-list";
import { listAll } from "@/domain/requests";
import { presentAdminRequest } from "@/features/requests/presenter";
import { findSpecialistApplications } from "@/features/admin/server/queries";
import { UserRole } from "@/domain/identity/types";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Всички заявки · Администрация DOMORA",
  description:
    "Пълен регистър на клиентските заявки в платформата DOMORA с детайли и възможност за управление.",
};
export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const user = await getServerSession();
  if (isDbConfigured) {
    if (!user) {
      redirect("/api/auth/logout?next=/login");
    }
    if (user.role !== UserRole.Admin) {
      redirect(user.role === UserRole.Specialist ? "/specialist" : "/client");
    }
  }

  const [initialRequests, specialists] = await Promise.all([
    isDbConfigured
      ? listAll(user).then((r) => r.map(presentAdminRequest))
      : null,
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
