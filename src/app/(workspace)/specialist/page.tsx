import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { DashboardSummary } from "@/features/specialist/dashboard-summary";
import { OpportunityFeed } from "@/features/specialist/opportunity-feed";
import { DailyAgenda } from "@/features/specialist/daily-agenda";
import { UserRole } from "@/domain/identity/types";
import { listOpportunities } from "@/domain/dispatch";
import { listAgenda, specialistSummary } from "@/domain/requests";
import { getActor } from "@/features/auth/server/actor";
import { presentSpecialistRequest } from "@/features/requests/presenter";
import { localDate } from "@/lib/format";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = { title: "Специалист" };
export const dynamic = "force-dynamic";

export default async function SpecialistPage() {
  const actor = isDbConfigured ? await getActor() : null;
  const [opportunities, agenda, summary] = actor
    ? await Promise.all([
        listOpportunities(actor),
        listAgenda(actor),
        specialistSummary(actor, localDate()),
      ])
    : [[], [], { activeJobs: 0, todaysEarnings: 0 }];

  return (
    <>
      <PageHeading
        eyebrow="РАБОТНО ПРОСТРАНСТВО"
        title="Задачите ви, подредени."
        description="Приемайте нови възможности и отчитайте извършената работа по текущите задачи."
      />
      <DashboardSummary {...summary} />
      {/* Phones show the agenda first; from lg the desktop order is kept. */}
      <div className="flex flex-col">
        <div className="order-2 lg:order-1">
          <OpportunityFeed
            initialOpportunities={opportunities.map(presentSpecialistRequest)}
            limit={5}
            viewAllHref="/specialist/opportunities"
            specialistId={
              actor?.role === UserRole.Specialist ? actor.id : undefined
            }
          />
        </div>
        <div className="order-1 lg:order-2">
          <DailyAgenda initialAgenda={agenda.map(presentSpecialistRequest)} />
        </div>
      </div>
    </>
  );
}
