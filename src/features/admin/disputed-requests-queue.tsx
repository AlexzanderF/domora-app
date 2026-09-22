"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { transitionRequestServerAction } from "@/features/requests/server/actions";
import { useToast } from "@/components/ui/toast-provider";
import { categories, requestStages } from "@/features/services/catalog";
import { money } from "@/lib/format";
import type { ServiceRequest } from "@/features/requests/types";
import styles from "./disputed-requests-queue.module.css";

export interface DisputedRequestsQueueProps {
  initialDisputedRequests?: ServiceRequest[] | null;
}

export function DisputedRequestsQueue({
  initialDisputedRequests,
}: DisputedRequestsQueueProps = {}) {
  const notify = useToast();
  const router = useRouter();
  const [resolvedIds, setResolvedIds] = useState<Set<number>>(new Set());
  const [processingId, setProcessingId] = useState<number | null>(null);

  const disputed = useMemo(() => {
    const source = initialDisputedRequests ?? [];
    return source.filter((r) => r.issue && !resolvedIds.has(r.id));
  }, [initialDisputedRequests, resolvedIds]);

  const handleResolve = async (request: ServiceRequest) => {
    try {
      setProcessingId(request.id);
      const res = await transitionRequestServerAction(request.id, {
        type: "resolve",
      });
      if (!res.success) {
        notify(res.error ?? "Възникна грешка при разрешаване на сигнала.");
        return;
      }
      setResolvedIds((prev) => new Set(prev).add(request.id));
      notify("Сигналът е маркиран като решен.");
      router.refresh();
    } catch {
      notify("Възникна грешка при разрешаване на сигнала.");
    } finally {
      setProcessingId(null);
    }
  };

  if (disputed.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon} aria-hidden="true">
          ✅
        </span>
        <p className={styles.emptyTitle}>Няма активни сигнали за проблеми</p>
        <p className={styles.emptyDescription}>
          Всички оспорвания между клиенти и специалисти са разрешени.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {disputed.map((request) => {
        const categoryName =
          categories.find((c) => c.id === request.category)?.name ?? "Друго";
        const isProcessing = processingId === request.id;

        return (
          <article
            key={request.id}
            className={styles.card}
            aria-label={request.service}
          >
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.title}>{request.service}</h3>
                <div className={styles.metaRow}>
                  <span className={styles.categoryBadge}>{categoryName}</span>
                  <span className={styles.dateText}>
                    {request.date} · {request.time}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleResolve(request)}
                disabled={isProcessing}
                className={styles.resolveButton}
              >
                Маркирай като решен
              </button>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Назначен специалист</span>
                <span className={styles.detailValue}>
                  {request.specialist || "Няма назначен специалист"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Клиент</span>
                <span className={styles.detailValue}>
                  {request.clientName || "—"}
                  {request.clientPhone ? ` · ${request.clientPhone}` : ""}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Статус на изпълнение</span>
                <span className={styles.detailValue}>
                  {requestStages[request.status]}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Стойност</span>
                <span className={styles.detailValue}>
                  {money(request.price)}
                </span>
              </div>
            </div>

            <div className={styles.issueSection}>
              <span className={styles.issueLabel}>
                Описание на проблема (от клиента)
              </span>
              <p className={styles.issueText}>{request.description}</p>
            </div>

            {request.report && (
              <div className={styles.reportSection}>
                <span className={styles.reportLabel}>Отчет от специалиста</span>
                <p className={styles.reportText}>{request.report}</p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
