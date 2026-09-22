"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import type { User, UserStatus } from "@/features/auth/types";
import { useToast } from "@/components/ui/toast-provider";
import { formatCompany, formatExperience } from "./specialist-format";
import styles from "./pending-specialists-queue.module.css";

export interface PendingSpecialistsQueueProps {
  initialSpecialists?: User[] | null;
}

export function PendingSpecialistsQueue({
  initialSpecialists,
}: PendingSpecialistsQueueProps = {}) {
  const [overrideStatuses, setOverrideStatuses] = useState<
    Record<number, UserStatus>
  >({});
  const { updateUserStatus } = useAuth();
  const notify = useToast();
  const router = useRouter();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const pending = useMemo(() => {
    const baseList = initialSpecialists ?? [];
    return baseList
      .map((spec) => {
        const override = overrideStatuses[spec.id];
        return override ? { ...spec, status: override } : spec;
      })
      .filter((spec) => spec.status === "PENDING");
  }, [initialSpecialists, overrideStatuses]);

  const handleDecision = async (spec: User, status: "ACTIVE" | "REJECTED") => {
    try {
      setProcessingId(spec.id);
      await updateUserStatus(spec.id, status);
      setOverrideStatuses((prev) => ({ ...prev, [spec.id]: status }));
      notify(
        status === "ACTIVE"
          ? `Кандидатурата на ${spec.name} е одобрена успешно.`
          : `Кандидатурата на ${spec.name} е отказана.`,
      );
      router.refresh();
    } catch {
      notify(
        status === "ACTIVE"
          ? "Възникна грешка при одобряване на кандидатурата."
          : "Възникна грешка при отказване на кандидатурата.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (pending.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon} aria-hidden="true">
          👥
        </span>
        <p className={styles.emptyTitle}>
          Няма чакащи за одобрение специалисти
        </p>
        <p className={styles.emptyDescription}>
          Всички подадени кандидатури вече са прегледани.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {pending.map((spec) => {
        const profile = spec.specialistProfile;
        const initial = spec.name.trim().charAt(0).toUpperCase() || "С";
        const isProcessing = processingId === spec.id;

        return (
          <article
            key={spec.id}
            className={styles.card}
            aria-label={`Кандидатура на ${spec.name}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.authorWrapper}>
                <div className={styles.avatar} aria-hidden="true">
                  {initial}
                </div>
                <div className={styles.authorMeta}>
                  <h3 className={styles.authorName}>{spec.name}</h3>
                  <div className={styles.badgesRow}>
                    {profile?.category && (
                      <span className={styles.categoryBadge}>
                        {profile.category}
                      </span>
                    )}
                    <span className={styles.regDate}>
                      Подадена на{" "}
                      {new Date(spec.createdAt).toLocaleDateString("bg-BG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.actionsGroup}>
                <button
                  type="button"
                  onClick={() => handleDecision(spec, "ACTIVE")}
                  disabled={isProcessing}
                  className={styles.approveButton}
                >
                  Одобри
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(spec, "REJECTED")}
                  disabled={isProcessing}
                  className={styles.rejectButton}
                >
                  Откажи
                </button>
              </div>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Телефон</span>
                <a href={`tel:${spec.phone}`} className={styles.detailLink}>
                  {spec.phone}
                </a>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Имейл</span>
                <a href={`mailto:${spec.email}`} className={styles.detailLink}>
                  {spec.email}
                </a>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Район на обслужване</span>
                <span className={styles.detailValue}>
                  {profile?.area || "—"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Професионален опит</span>
                <span className={styles.detailValue}>
                  {formatExperience(profile?.experienceYears)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Фирма / ЕИК</span>
                <span className={styles.detailValue}>
                  {formatCompany(profile?.companyName, profile?.eik)}
                </span>
              </div>
            </div>

            {profile?.bio && (
              <div className={styles.bioSection}>
                <span className={styles.bioLabel}>
                  Професионално представяне (Био)
                </span>
                <p className={styles.bioText}>{profile.bio}</p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
