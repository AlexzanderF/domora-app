"use client";

import { Card } from "@/components/ui/card";
import { money } from "@/lib/format";
import type { AdminKpiMetrics } from "./server/metrics";
import styles from "./admin-command-center.module.css";

export interface AdminKpiCardsProps {
  initialMetrics: AdminKpiMetrics | null;
}

export function AdminKpiCards({ initialMetrics }: AdminKpiCardsProps) {
  const unassignedUrgentCount = initialMetrics?.unassignedUrgentCount ?? 0;
  const pendingSpecialistsCount = initialMetrics?.pendingSpecialistsCount ?? 0;
  const activeRepairsCount = initialMetrics?.activeRepairsCount ?? 0;
  const monthlyRevenue = initialMetrics?.monthlyRevenue ?? 0;

  return (
    <div className={`stats ${styles.kpiGrid}`}>
      {/* 1. Неразпределени спешни заявки */}
      <Card className={`${styles.kpiCard} ${styles.cardUrgent}`}>
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
      </Card>

      {/* 2. Чакащи одобрение специалисти */}
      <Card className={`${styles.kpiCard} ${styles.cardPending}`}>
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
      </Card>

      {/* 3. Активни ремонти днес */}
      <Card className={`${styles.kpiCard} ${styles.cardActive}`}>
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
      </Card>

      {/* 4. Приходи за месеца */}
      <Card className={`${styles.kpiCard} ${styles.cardRevenue}`}>
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
      </Card>
    </div>
  );
}
