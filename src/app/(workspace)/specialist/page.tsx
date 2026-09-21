import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { RequestList } from "@/features/requests/request-list";
import { WorkspaceStats } from "@/features/workspace/workspace-stats";
import { getServerSession } from "@/features/auth/server/session";
import { findSpecialistRequests } from "@/features/requests/server/queries";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = { title: "Специалист" };
export const dynamic = "force-dynamic";

export default async function SpecialistPage() {
  const user = await getServerSession();
  if (isDbConfigured) {
    if (!user) {
      redirect("/login");
    }
    if (user.role === "SPECIALIST" && user.status === "PENDING") {
      redirect("/pending-approval");
    }
    if (user.role === "CLIENT") {
      redirect("/client");
    }
  }

  const initialRequests =
    user?.role === "SPECIALIST" || user?.role === "ADMIN"
      ? await findSpecialistRequests(
          user.id,
          user.specialistProfile?.category,
          user.specialistProfile?.area,
        )
      : null;

  const initialStats = initialRequests
    ? {
        total: initialRequests.length,
        active: initialRequests.filter(
          (req) => !req.cancelled && req.status < 5,
        ).length,
        completed: initialRequests.filter((req) => req.status === 5).length,
      }
    : null;

  return (
    <>
      <PageHeading
        eyebrow="РАБОТНО ПРОСТРАНСТВО"
        title="Задачите ви, подредени."
        description="Приемайте задачи и отчитайте извършената работа."
      />
      <WorkspaceStats initialStats={initialStats} />
      <div className="card">
        <RequestList
          actions
          role="specialist"
          initialRequests={initialRequests}
        />
      </div>
    </>
  );
}
