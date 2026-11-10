import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { DashboardSummary } from "@/features/specialist/dashboard-summary";
import { OpportunityFeed } from "@/features/specialist/opportunity-feed";
import { DailyAgenda } from "@/features/specialist/daily-agenda";
import { isActiveStage } from "@/features/requests/request-rules";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { getServerSession } from "@/features/auth/server/session";
import { RequestStatus } from "@/domain/requests/types";
import { findSpecialistRequests } from "@/features/requests/server/queries";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = { title: "Специалист" };
export const dynamic = "force-dynamic";

export default async function SpecialistPage() {
  const user = await getServerSession();
  if (isDbConfigured) {
    if (!user) {
      redirect("/api/auth/logout?next=/login");
    }
    if (
      user.role === UserRole.Specialist &&
      user.status === UserStatus.Pending
    ) {
      redirect("/pending-approval");
    }
    if (user.role === UserRole.Client) {
      redirect("/client");
    }
  }

  const allRequests =
    user?.role === UserRole.Specialist || user?.role === UserRole.Admin
      ? await findSpecialistRequests({
          id: user.id,
          role: user.role,
          status: user.status,
        })
      : null;

  const initialOpportunities = allRequests
    ? allRequests.filter(
        (req) => req.status === RequestStatus.Created && !req.cancelled,
      )
    : null;
  const initialAgenda = allRequests
    ? allRequests.filter((req) => !req.cancelled && isActiveStage(req.status))
    : null;

  return (
    <>
      <PageHeading
        eyebrow="РАБОТНО ПРОСТРАНСТВО"
        title="Задачите ви, подредени."
        description="Приемайте нови възможности и отчитайте извършената работа по текущите задачи."
      />
      <DashboardSummary initialRequests={allRequests ?? []} />
      {/* Phones show the agenda first; from lg the desktop order is kept. */}
      <div className="flex flex-col">
        <div className="order-2 lg:order-1">
          <OpportunityFeed
            initialOpportunities={initialOpportunities ?? []}
            limit={5}
            viewAllHref="/specialist/opportunities"
            specialistId={
              user?.role === UserRole.Specialist ? user.id : undefined
            }
          />
        </div>
        <div className="order-1 lg:order-2">
          <DailyAgenda initialAgenda={initialAgenda ?? []} />
        </div>
      </div>
    </>
  );
}
