"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ServiceIcon } from "@/features/services/service-icon";
import { categories } from "@/features/services/catalog";
import { useToast } from "@/components/ui/toast-provider";
import { assignSpecialistAction } from "@/features/requests/server/actions";
import { money } from "@/lib/format";
import { RequestPriority } from "@/domain/requests/types";
import type { ServiceRequest } from "@/domain/requests/types";
import styles from "./specialist-dashboard.module.css";

function isUrgent(request: ServiceRequest): boolean {
  return (
    request.priority === RequestPriority.Urgent ||
    request.priority === RequestPriority.Emergency
  );
}

export function OpportunityFeed({
  initialOpportunities,
  limit,
  viewAllHref,
  specialistId,
}: {
  initialOpportunities: ServiceRequest[];
  limit?: number;
  viewAllHref?: string;
  specialistId?: number;
}) {
  const router = useRouter();
  const notify = useToast();
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const visible = initialOpportunities.filter(
    (request) => !dismissedIds.has(request.id),
  );
  const items = limit ? visible.slice(0, limit) : visible;

  async function accept(request: ServiceRequest) {
    setAcceptingId(request.id);
    try {
      const result = await assignSpecialistAction(request.id);
      if (!result.success) {
        notify(result.error ?? "Грешка при приемане на заявката.");
        return;
      }
      notify("Заявката е приета и добавена към дневния график.");
      router.refresh();
    } catch {
      notify("Грешка при приемане на заявката. Опитайте отново.");
    } finally {
      setAcceptingId(null);
    }
  }

  function dismiss(request: ServiceRequest) {
    setDismissedIds((current) => new Set(current).add(request.id));
    notify("Възможността е скрита от вашия списък.");
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Нови възможности</h2>
          <span className={styles.sectionBadge}>Достъпни заявки</span>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className={styles.sectionLink}>
            Към всички възможности →
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <div className="empty">Няма нови възможности в момента.</div>
      ) : (
        items.map((request) => (
          <article
            className="request"
            key={request.id}
            aria-label={request.service}
          >
            <div className="tinyicon">
              <ServiceIcon category={request.category} />
            </div>
            <div className="requestinfo">
              <h3>{request.service}</h3>
              <p>{request.address}</p>
              <span className="badge">
                {categories[request.category].name}
              </span>{" "}
              <span className={`badge ${isUrgent(request) ? "wait" : ""}`}>
                {isUrgent(request) ? "Спешна" : "Стандартна"}
              </span>{" "}
              {(specialistId === undefined
                ? request.recommendedSpecialistId !== undefined
                : request.recommendedSpecialistId === specialistId) && (
                <span className={styles.recommendedBadge}>
                  Препоръчана от администратор
                </span>
              )}
              <div className="actions">
                <button
                  className="primary"
                  disabled={acceptingId === request.id}
                  onClick={() => void accept(request)}
                >
                  {acceptingId === request.id ? "Приемане…" : "Приеми"}
                </button>
                <button className="secondary" onClick={() => dismiss(request)}>
                  Пропусни
                </button>
              </div>
            </div>
            <span className="amount">{money(request.price)}</span>
          </article>
        ))
      )}
    </section>
  );
}
