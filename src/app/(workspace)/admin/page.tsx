import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { AdminKpiCards } from "@/features/admin/admin-kpi-cards";
import { PendingSpecialistsQueue } from "@/features/admin/pending-specialists-queue";
import { DisputedRequestsQueue } from "@/features/admin/disputed-requests-queue";
import { UnassignedRequestsQueue } from "@/features/admin/unassigned-requests-queue";
import { findAdminKpiMetrics } from "@/features/admin/server/metrics";
import {
  findDisputedRequestsForAdmin,
  findSpecialistApplications,
  findUnassignedRequestsForAdmin,
} from "@/features/admin/server/queries";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";
import styles from "@/features/admin/admin-command-center.module.css";

export const metadata: Metadata = {
  title: "Команден център · Администрация DOMORA",
  description:
    "Оперативен триаж на спешни заявки, одобрение на специалисти и мониторинг на дейностите в платформата.",
};
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getServerSession();
  if (isDbConfigured) {
    if (!user) {
      redirect("/login");
    }
    if (user.role !== "ADMIN") {
      redirect(user.role === "SPECIALIST" ? "/specialist" : "/client");
    }
  }

  const [
    initialMetrics,
    initialSpecialists,
    initialDisputedRequests,
    initialUnassignedRequests,
  ] = await Promise.all([
    findAdminKpiMetrics(),
    findSpecialistApplications(),
    findDisputedRequestsForAdmin(),
    findUnassignedRequestsForAdmin(),
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
      <div className={styles.queuesContainer}>
        {/* Queue 1: Спешни & Непоети заявки */}
        <section className={styles.queueSection}>
          <div className={styles.queueHeader}>
            <div className={styles.queueTitleGroup}>
              <h2 className={styles.queueTitle}>Спешни &amp; Непоети заявки</h2>
              <span className={styles.queueBadge}>Опашка за триаж</span>
            </div>
            <Link href="/admin/requests" className={styles.queueLink}>
              Към всички заявки →
            </Link>
          </div>
          <UnassignedRequestsQueue
            initialRequests={initialUnassignedRequests}
            initialSpecialists={initialSpecialists}
          />
        </section>

        {/* Queue 2: Чакащи одобрение */}
        <section className={styles.queueSection}>
          <div className={styles.queueHeader}>
            <div className={styles.queueTitleGroup}>
              <h2 className={styles.queueTitle}>Чакащи одобрение</h2>
              <span className={styles.queueBadge}>Верификация</span>
            </div>
            <Link href="/admin/specialists" className={styles.queueLink}>
              Към специалисти →
            </Link>
          </div>
          <PendingSpecialistsQueue initialSpecialists={initialSpecialists} />
        </section>

        {/* Queue 3: Сигнали за проблеми */}
        <section className={styles.queueSection}>
          <div className={styles.queueHeader}>
            <div className={styles.queueTitleGroup}>
              <h2 className={styles.queueTitle}>Сигнали за проблеми</h2>
              <span className={styles.queueBadge}>Мониторинг</span>
            </div>
            <span className={styles.queueBadge}>Оспорвания</span>
          </div>
          <DisputedRequestsQueue
            initialDisputedRequests={initialDisputedRequests}
          />
        </section>
      </div>
    </>
  );
}
