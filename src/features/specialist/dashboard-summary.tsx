"use client";

import Link from "next/link";
import { useDemo } from "@/features/requests/demo-provider";
import { isActiveStage } from "@/features/requests/request-rules";
import { localDate, money } from "@/lib/format";
import { RequestStatus } from "@/features/requests/types";
import type { ServiceRequest } from "@/features/requests/types";
import styles from "./specialist-dashboard.module.css";

function computeStats(requests: ServiceRequest[]) {
  const today = localDate();
  const activeJobs = requests.filter(
    (request) => !request.cancelled && isActiveStage(request.status),
  ).length;
  const todaysEarnings = requests
    .filter(
      (request) =>
        !request.cancelled &&
        request.status === RequestStatus.Completed &&
        request.date === today,
    )
    .reduce((sum, request) => sum + (request.price || 0), 0);
  return { activeJobs, todaysEarnings };
}

export function DashboardSummary({
  initialRequests,
}: {
  initialRequests?: ServiceRequest[] | null;
}) {
  const { requests: demoRequests } = useDemo();
  const { activeJobs, todaysEarnings } = computeStats(
    initialRequests ?? demoRequests,
  );

  return (
    <div className={styles.summaryRow}>
      <div className={`card ${styles.summaryCard}`}>
        <span className={styles.summaryLabel}>Активни задачи</span>
        <strong className={styles.summaryValue}>{activeJobs}</strong>
      </div>
      <div className={`card ${styles.summaryCard}`}>
        <span className={styles.summaryLabel}>Приходи за днес</span>
        <strong className={styles.summaryValue}>{money(todaysEarnings)}</strong>
      </div>
      <Link href="/specialist/history" className={styles.summaryLink}>
        История &amp; приходи →
      </Link>
    </div>
  );
}
