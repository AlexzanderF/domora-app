import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { OpportunityFeed } from "@/features/specialist/opportunity-feed";
import { UserRole, UserStatus } from "@/features/auth/types";
import { getServerSession } from "@/features/auth/server/session";
import { RequestStatus } from "@/features/requests/types";
import { findSpecialistRequests } from "@/features/requests/server/queries";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = { title: "Нови възможности" };
export const dynamic = "force-dynamic";

export default async function SpecialistOpportunitiesPage() {
  const user = await getServerSession();
  if (isDbConfigured) {
    if (!user) {
      redirect("/login");
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
      ? await findSpecialistRequests(
          user.id,
          user.specialistProfile?.category,
          user.specialistProfile?.area,
        )
      : null;

  const initialOpportunities = allRequests
    ? allRequests.filter(
        (req) => req.status === RequestStatus.Created && !req.cancelled,
      )
    : null;

  return (
    <>
      <PageHeading
        eyebrow="ВЪЗМОЖНОСТИ ЗА РАБОТА"
        title="Нови заявки във вашия район"
        description="Преглеждайте и приемайте налични заявки, съответстващи на вашия профил."
      />
      <OpportunityFeed
        initialOpportunities={initialOpportunities}
        specialistId={user?.role === UserRole.Specialist ? user.id : undefined}
      />
    </>
  );
}
