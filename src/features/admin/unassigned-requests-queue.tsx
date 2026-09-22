"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminAssignSpecialistAction,
  adminRecommendSpecialistAction,
} from "@/features/requests/server/actions";
import type { User } from "@/features/auth/types";
import { useToast } from "@/components/ui/toast-provider";
import { categories } from "@/features/services/catalog";
import { money } from "@/lib/format";
import type { ServiceRequest } from "@/features/requests/types";
import styles from "./unassigned-requests-queue.module.css";

export interface UnassignedRequestsQueueProps {
  initialRequests?: ServiceRequest[] | null;
  initialSpecialists?: User[] | null;
}

function priorityLabel(priority?: ServiceRequest["priority"]): string {
  switch (priority) {
    case "EMERGENCY":
      return "Аварийна";
    case "URGENT":
      return "Спешна";
    case "HOLIDAY":
      return "Празнична";
    default:
      return "Стандартна";
  }
}

function isUrgent(priority?: ServiceRequest["priority"]): boolean {
  return priority === "URGENT" || priority === "EMERGENCY";
}

export function UnassignedRequestsQueue({
  initialRequests,
  initialSpecialists,
}: UnassignedRequestsQueueProps = {}) {
  const notify = useToast();
  const router = useRouter();
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [recommendedOverrides, setRecommendedOverrides] = useState<
    Record<number, number>
  >({});
  const [selectedSpecialists, setSelectedSpecialists] = useState<
    Record<number, number>
  >({});
  const [processingId, setProcessingId] = useState<number | null>(null);

  const activeSpecialists = useMemo(() => {
    return (initialSpecialists ?? []).filter((s) => s.status === "ACTIVE");
  }, [initialSpecialists]);

  const specialistNames = useMemo(() => {
    return new Map(activeSpecialists.map((s) => [s.id, s.name]));
  }, [activeSpecialists]);

  const queue = useMemo(() => {
    const source = initialRequests ?? [];
    return source.filter((r) => !r.cancelled && !assignedIds.has(r.id));
  }, [initialRequests, assignedIds]);

  const sortedSpecialistsFor = (request: ServiceRequest): User[] => {
    const trade = categories.find((c) => c.id === request.category)?.name;
    return [...activeSpecialists].sort((a, b) => {
      const aMatch = trade && a.specialistProfile?.category === trade ? 0 : 1;
      const bMatch = trade && b.specialistProfile?.category === trade ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.name.localeCompare(b.name, "bg");
    });
  };

  const getSelectedId = (request: ServiceRequest): number | undefined => {
    const explicit = selectedSpecialists[request.id];
    if (explicit) return explicit;
    return request.recommendedSpecialistId ?? recommendedOverrides[request.id];
  };

  const handleAssign = async (request: ServiceRequest) => {
    const specialistId = getSelectedId(request);
    if (!specialistId) {
      notify("Първо изберете специалист от падащия списък.");
      return;
    }
    try {
      setProcessingId(request.id);
      const res = await adminAssignSpecialistAction(request.id, specialistId);
      if (!res.success) {
        notify(res.error ?? "Възникна грешка при разпределяне на заявката.");
        return;
      }
      setAssignedIds((prev) => new Set(prev).add(request.id));
      notify("Заявката е разпределена към специалиста.");
      router.refresh();
    } catch {
      notify("Възникна грешка при разпределяне на заявката.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRecommend = async (request: ServiceRequest) => {
    const specialistId = getSelectedId(request);
    if (!specialistId) {
      notify("Първо изберете специалист от падащия списък.");
      return;
    }
    try {
      setProcessingId(request.id);
      const res = await adminRecommendSpecialistAction(
        request.id,
        specialistId,
      );
      if (!res.success) {
        notify(res.error ?? "Възникна грешка при препоръчване на заявката.");
        return;
      }
      setRecommendedOverrides((prev) => ({
        ...prev,
        [request.id]: specialistId,
      }));
      notify("Заявката е препоръчана на специалиста.");
      router.refresh();
    } catch {
      notify("Възникна грешка при препоръчване на заявката.");
    } finally {
      setProcessingId(null);
    }
  };

  if (queue.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon} aria-hidden="true">
          ⚡
        </span>
        <p className={styles.emptyTitle}>Няма непоети спешни заявки</p>
        <p className={styles.emptyDescription}>
          Всички заявки са разпределени към специалисти.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {queue.map((request) => {
        const categoryName =
          categories.find((c) => c.id === request.category)?.name ?? "Друго";
        const urgent = isUrgent(request.priority);
        const recommendedId =
          request.recommendedSpecialistId ?? recommendedOverrides[request.id];
        const recommendedName = recommendedId
          ? specialistNames.get(recommendedId)
          : undefined;
        const isProcessing = processingId === request.id;
        const options = sortedSpecialistsFor(request);

        return (
          <article
            key={request.id}
            className={`${styles.card} ${urgent ? styles.cardUrgent : ""}`}
            aria-label={request.service}
          >
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.title}>{request.service}</h3>
                <div className={styles.metaRow}>
                  <span
                    className={`${styles.priorityBadge} ${urgent ? styles.priorityUrgent : ""}`}
                  >
                    {priorityLabel(request.priority)}
                  </span>
                  <span className={styles.categoryBadge}>{categoryName}</span>
                  <span className={styles.dateText}>
                    {request.date} · {request.time}
                  </span>
                </div>
              </div>
              <span className={styles.price}>{money(request.price)}</span>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Адрес на клиента</span>
                <span className={styles.detailValue}>{request.address}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Клиент</span>
                <span className={styles.detailValue}>
                  {request.clientName || "—"}
                  {request.clientPhone ? ` · ${request.clientPhone}` : ""}
                </span>
              </div>
            </div>

            {recommendedName && (
              <p className={styles.recommendedBadge}>
                Препоръчана на {recommendedName}
              </p>
            )}

            <div className={styles.dispatchRow}>
              <label className={styles.selectLabel}>
                Специалист
                <select
                  className={styles.select}
                  value={getSelectedId(request) ?? ""}
                  onChange={(e) =>
                    setSelectedSpecialists((prev) => ({
                      ...prev,
                      [request.id]: Number(e.target.value),
                    }))
                  }
                  aria-label={`Избор на специалист за ${request.service}`}
                >
                  <option value="">Избери специалист…</option>
                  {options.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                      {spec.specialistProfile?.category
                        ? ` · ${spec.specialistProfile.category}`
                        : ""}
                      {spec.specialistProfile?.area
                        ? ` · ${spec.specialistProfile.area}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.actionsGroup}>
                <button
                  type="button"
                  onClick={() => handleAssign(request)}
                  disabled={isProcessing}
                  className={styles.assignButton}
                >
                  Разпредели
                </button>
                <button
                  type="button"
                  onClick={() => handleRecommend(request)}
                  disabled={isProcessing}
                  className={styles.recommendButton}
                >
                  Препоръчай
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
