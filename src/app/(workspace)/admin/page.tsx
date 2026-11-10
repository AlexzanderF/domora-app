import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { QueueSection, QueueTag } from "@/features/admin/admin-ui";
import { AdminKpiCards } from "@/features/admin/admin-kpi-cards";
import { PendingSpecialistsQueue } from "@/features/admin/pending-specialists-queue";
import { DisputedRequestsQueue } from "@/features/admin/disputed-requests-queue";
import { UnassignedRequestsQueue } from "@/features/admin/unassigned-requests-queue";
import { findAdminKpiMetrics } from "@/features/admin/server/metrics";
import {
  findDisputedRequestsForAdmin,
  findResolvedDisputesForAdmin,
  findSpecialistApplications,
  findUnassignedRequestsForAdmin,
} from "@/features/admin/server/queries";
import { UserRole } from "@/domain/identity/types";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export const metadata: Metadata = {
  title: "Команден център · Администрация DOMORA",
  description:
    "Оперативен триаж на спешни заявки, одобрение на специалисти и мониторинг на дейностите в платформата.",
};
export const dynamic = "force-dynamic";

function QueueLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="text-[13px] font-semibold text-primary no-underline transition-opacity hover:underline hover:opacity-85"
    >
      {children}
    </Link>
  );
}

export default async function AdminPage() {
  const user = await getServerSession();
  if (isDbConfigured) {
    if (!user) {
      redirect("/api/auth/logout?next=/login");
    }
    if (user.role !== UserRole.Admin) {
      redirect(user.role === UserRole.Specialist ? "/specialist" : "/client");
    }
  }

  const [
    initialMetrics,
    initialSpecialists,
    initialDisputedRequests,
    resolvedDisputes,
    initialUnassignedRequests,
  ] = await Promise.all([
    findAdminKpiMetrics(),
    findSpecialistApplications(),
    findDisputedRequestsForAdmin(user),
    findResolvedDisputesForAdmin(),
    findUnassignedRequestsForAdmin(user),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="АДМИНИСТРАТИВЕН ПАНЕЛ"
        title="Команден център"
        description="Оперативен триаж на спешни заявки, одобрение на кандидатстващи специалисти и активен мониторинг."
      />

      {/* Top row: 4 KPI metric cards */}
      <AdminKpiCards initialMetrics={initialMetrics} />

      {/* Triage queue sections scaffolding */}
      <div className="flex flex-col gap-6">
        {/* Queue 1: Спешни & Непоети заявки */}
        <QueueSection
          title="Спешни & Непоети заявки"
          tag="Опашка за триаж"
          action={
            <QueueLink href="/admin/requests">Към всички заявки →</QueueLink>
          }
        >
          <UnassignedRequestsQueue
            initialRequests={initialUnassignedRequests}
            initialSpecialists={initialSpecialists}
          />
        </QueueSection>

        {/* Queue 2: Чакащи одобрение */}
        <QueueSection
          title="Чакащи одобрение"
          tag="Верификация"
          action={
            <QueueLink href="/admin/specialists">Към специалисти →</QueueLink>
          }
        >
          <PendingSpecialistsQueue initialSpecialists={initialSpecialists} />
        </QueueSection>

        {/* Queue 3: Сигнали за проблеми */}
        <QueueSection
          title="Сигнали за проблеми"
          tag="Мониторинг"
          action={<QueueTag>Оспорвания</QueueTag>}
        >
          <DisputedRequestsQueue
            initialDisputedRequests={initialDisputedRequests}
            resolvedDisputes={resolvedDisputes}
          />
        </QueueSection>
      </div>
    </>
  );
}
