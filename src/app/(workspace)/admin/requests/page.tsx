import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { RequestList } from "@/features/requests/request-list";
import { findAllRequestsForAdmin } from "@/features/admin/server/metrics";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Всички заявки · Администрация DOMORA",
  description: "Преглед и управление на всички клиентски заявки в системата.",
};
export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const user = await getServerSession();
  if (isDbConfigured) {
    if (!user) {
      redirect("/login");
    }
    if (user.role !== "ADMIN") {
      redirect(user.role === "SPECIALIST" ? "/specialist" : "/client");
    }
  }

  const initialRequests = await findAllRequestsForAdmin();

  return (
    <>
      <PageHeading
        eyebrow="АДМИНИСТРАТИВЕН ПАНЕЛ"
        title="Всички заявки"
        description="Преглед и управление на всички клиентски заявки в системата."
      />
      <div className="card">
        <RequestList actions role="admin" initialRequests={initialRequests} />
      </div>
    </>
  );
}
