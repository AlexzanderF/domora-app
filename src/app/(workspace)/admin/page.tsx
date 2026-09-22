import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { AdminKpiCards } from "@/features/admin/admin-kpi-cards";
import { findAdminKpiMetrics } from "@/features/admin/server/metrics";
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

  const initialMetrics = await findAdminKpiMetrics();

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
          <div className={styles.queuePlaceholder}>
            <span className={styles.placeholderIcon} aria-hidden="true">
              ⚡
            </span>
            <p className={styles.placeholderHeading}>
              Диспечерски триаж на спешни и непоети заявки
            </p>
            <p className={styles.placeholderDescription}>
              Слот за входящи неразпределени заявки с възможност за директно
              назначаване или препоръчване към активни специалисти (предстои
              имплементация).
            </p>
          </div>
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
          <div className={styles.queuePlaceholder}>
            <span className={styles.placeholderIcon} aria-hidden="true">
              👥
            </span>
            <p className={styles.placeholderHeading}>
              Преглед и одобрение на кандидатстващи специалисти
            </p>
            <p className={styles.placeholderDescription}>
              Слот за преглед на подадени заявления от нови специалисти с данни
              за квалификация, опит и регистрация (предстои имплементация).
            </p>
          </div>
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
          <div className={styles.queuePlaceholder}>
            <span className={styles.placeholderIcon} aria-hidden="true">
              ⚠️
            </span>
            <p className={styles.placeholderHeading}>
              Оспорвани заявки и клиентски рекламации
            </p>
            <p className={styles.placeholderDescription}>
              Слот за наблюдение в реално време на възникнали клиентски спорове,
              сигнали за качество и административна намеса (предстои
              имплементация).
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
