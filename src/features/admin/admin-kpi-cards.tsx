"use client";

import { useDemo } from "@/features/requests/demo-provider";
import { isActiveStage } from "@/features/requests/request-rules";
import { isUrgentPriority } from "@/features/requests/priority";
import { RequestStatus } from "@/features/requests/types";
import { money } from "@/lib/format";
import type { AdminKpiMetrics } from "./server/metrics";
import styles from "./admin-command-center.module.css";

export interface AdminKpiCardsProps {
  initialMetrics?: AdminKpiMetrics | null;
}

export function AdminKpiCards({ initialMetrics }: AdminKpiCardsProps = {}) {
  const { requests } = useDemo();

  // Compute live values: use server-provided DB metrics if present, otherwise calculate from demo provider
  const unassignedUrgentCount =
    initialMetrics?.unassignedUrgentCount ??
    requests.filter(
      (r) =>
        !r.cancelled &&
        r.status === RequestStatus.Created &&
        isUrgentPriority(r.priority),
    ).length;

  const pendingSpecialistsCount = initialMetrics?.pendingSpecialistsCount ?? 1;

  const activeRepairsCount =
    initialMetrics?.activeRepairsCount ??
    requests.filter((r) => !r.cancelled && isActiveStage(r.status)).length;

  const monthlyRevenue =
    initialMetrics?.monthlyRevenue ??
    requests
      .filter((r) => r.status === RequestStatus.Completed)
      .reduce((sum, r) => sum + (r.price || 0), 0);

  return (
    <div className={`stats ${styles.kpiGrid}`}>
      {/* 1. Неразпределени спешни заявки */}
      <div className={`card ${styles.kpiCard} ${styles.cardUrgent}`}>
        <div className={styles.cardAccentBar} />
        <div>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">
              ⚡
            </span>
            <span className={styles.cardTag}>Спешни</span>
          </div>
          <div className={styles.cardLabel}>Неразпределени спешни заявки</div>
        </div>
        <div>
          <strong className={styles.cardValue}>{unassignedUrgentCount}</strong>
          <div className={styles.cardSubtext}>
            {unassignedUrgentCount === 1
              ? "1 чакаща спешна заявка"
              : `${unassignedUrgentCount} чакащи спешни заявки`}
          </div>
        </div>
      </div>

      {/* 2. Чакащи одобрение специалисти */}
      <div className={`card ${styles.kpiCard} ${styles.cardPending}`}>
        <div className={styles.cardAccentBar} />
        <div>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">
              👥
            </span>
            <span className={styles.cardTag}>Кандидати</span>
          </div>
          <div className={styles.cardLabel}>Чакащи одобрение специалисти</div>
        </div>
        <div>
          <strong className={styles.cardValue}>
            {pendingSpecialistsCount}
          </strong>
          <div className={styles.cardSubtext}>
            {pendingSpecialistsCount === 1
              ? "1 нов профил за преглед"
              : `${pendingSpecialistsCount} нови профила за преглед`}
          </div>
        </div>
      </div>

      {/* 3. Активни ремонти днес */}
      <div className={`card ${styles.kpiCard} ${styles.cardActive}`}>
        <div className={styles.cardAccentBar} />
        <div>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">
              🔧
            </span>
            <span className={styles.cardTag}>В процес</span>
          </div>
          <div className={styles.cardLabel}>Активни ремонти днес</div>
        </div>
        <div>
          <strong className={styles.cardValue}>{activeRepairsCount}</strong>
          <div className={styles.cardSubtext}>Поети или в изпълнение</div>
        </div>
      </div>

      {/* 4. Приходи за месеца */}
      <div className={`card ${styles.kpiCard} ${styles.cardRevenue}`}>
        <div className={styles.cardAccentBar} />
        <div>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">
              📈
            </span>
            <span className={styles.cardTag}>Оборот</span>
          </div>
          <div className={styles.cardLabel}>Приходи за месеца</div>
        </div>
        <div>
          <strong className={styles.cardValue}>{money(monthlyRevenue)}</strong>
          <div className={styles.cardSubtext}>От приключени заявки</div>
        </div>
      </div>
    </div>
  );
}
