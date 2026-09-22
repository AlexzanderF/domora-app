import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { DashboardSummary } from "@/features/specialist/dashboard-summary";
import { OpportunityFeed } from "@/features/specialist/opportunity-feed";
import { DailyAgenda } from "@/features/specialist/daily-agenda";
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

  const allRequests =
    user?.role === "SPECIALIST" || user?.role === "ADMIN"
      ? await findSpecialistRequests(
          user.id,
          user.specialistProfile?.category,
          user.specialistProfile?.area,
        )
      : null;

  const initialOpportunities = allRequests
    ? allRequests.filter((req) => req.status === 0 && !req.cancelled)
    : null;
  const initialAgenda = allRequests
    ? allRequests.filter(
        (req) => !req.cancelled && req.status >= 1 && req.status <= 4,
      )
    : null;

  return (
    <>
      <PageHeading
        eyebrow="РАБОТНО ПРОСТРАНСТВО"
        title="Задачите ви, подредени."
        description="Приемайте нови възможности и отчитайте извършената работа по текущите задачи."
      />
      <DashboardSummary initialRequests={allRequests} />
      <OpportunityFeed
        initialOpportunities={initialOpportunities}
        limit={5}
        viewAllHref="/specialist/opportunities"
        specialistId={user?.role === "SPECIALIST" ? user.id : undefined}
      />
      <DailyAgenda initialAgenda={initialAgenda} />
    </>
  );
}
