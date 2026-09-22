import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { RequestList } from "@/features/requests/request-list";
import { findAllRequestsForAdmin } from "@/features/admin/server/metrics";
import { UserRole } from "@/features/auth/types";
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

  const initialRequests = await findAllRequestsForAdmin();

  return (
    <>
      <PageHeading
        eyebrow="АДМИНИСТРАЦИЯ"
        title="Всички заявки"
        description="Преглед и филтриране на всички клиентски заявки за услуги в платформата."
      />
      <div className="card">
        <RequestList actions role="admin" initialRequests={initialRequests} />
      </div>
    </>
  );
}
