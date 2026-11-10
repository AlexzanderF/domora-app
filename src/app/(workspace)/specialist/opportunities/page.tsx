import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { OpportunityFeed } from "@/features/specialist/opportunity-feed";
import { UserRole } from "@/domain/identity/types";
import { listOpportunities } from "@/domain/dispatch";
import { getActor } from "@/features/auth/server/actor";
import { presentSpecialistRequest } from "@/features/requests/presenter";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = { title: "Нови възможности" };
export const dynamic = "force-dynamic";

export default async function SpecialistOpportunitiesPage() {
  const actor = isDbConfigured ? await getActor() : null;
  const opportunities = actor ? await listOpportunities(actor) : [];

  return (
    <>
      <PageHeading
        eyebrow="ВЪЗМОЖНОСТИ ЗА РАБОТА"
        title="Нови заявки във вашия район"
        description="Преглеждайте и приемайте налични заявки, съответстващи на вашия профил."
      />
      <OpportunityFeed
        initialOpportunities={opportunities.map(presentSpecialistRequest)}
        specialistId={
          actor?.role === UserRole.Specialist ? actor.id : undefined
        }
      />
    </>
  );
}
