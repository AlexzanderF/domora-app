"use client";

import { useMemo, useState } from "react";
import { useAuth, useSpecialists } from "@/features/auth/auth-provider";
import type { User, UserStatus } from "@/features/auth/types";
import { useToast } from "@/components/ui/toast-provider";
import styles from "./specialists-review.module.css";

type FilterTab = "ALL" | "PENDING" | "ACTIVE" | "REJECTED";

interface TabDefinition {
  key: FilterTab;
  label: string;
}

const TABS: TabDefinition[] = [
  { key: "ALL", label: "Всички" },
  { key: "PENDING", label: "Чакащи одобрение" },
  { key: "ACTIVE", label: "Одобрени" },
  { key: "REJECTED", label: "Отказани" },
];

function getStatusBadge(status: UserStatus) {
  switch (status) {
    case "PENDING":
      return <span className={styles.badgePending}>Чака преглед</span>;
    case "ACTIVE":
      return <span className={styles.badgeActive}>Одобрен</span>;
    case "REJECTED":
      return <span className={styles.badgeRejected}>Отказан</span>;
    default:
      return null;
  }
}

function formatExperience(years?: number): string {
  if (years === undefined || years === null) return "—";
  if (years === 0) return "Под 1 година";
  if (years === 1) return "1 година";
  return `${years} години`;
}

function formatCompany(companyName?: string, eik?: string): string {
  if (companyName && eik) {
    return `${companyName} (ЕИК: ${eik})`;
  }
  if (companyName) {
    return companyName;
  }
  if (eik) {
    return `ЕИК: ${eik}`;
  }
  return "Физическо лице";
}

export interface SpecialistsReviewProps {
  initialSpecialists?: User[] | null;
}

export function SpecialistsReview({
  initialSpecialists,
}: SpecialistsReviewProps = {}) {
  const demoSpecialists = useSpecialists();
  const [overrideStatuses, setOverrideStatuses] = useState<
    Record<string, UserStatus>
  >({});
  const { updateUserStatus } = useAuth();
  const notify = useToast();

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const specialists = useMemo(() => {
    const baseList = initialSpecialists ?? demoSpecialists;
    return baseList.map((s) => {
      const override = overrideStatuses[s.id];
      return override ? { ...s, status: override } : s;
    });
  }, [initialSpecialists, demoSpecialists, overrideStatuses]);

  const counts = useMemo(() => {
    return {
      ALL: specialists.length,
      PENDING: specialists.filter((s) => s.status === "PENDING").length,
      ACTIVE: specialists.filter((s) => s.status === "ACTIVE").length,
      REJECTED: specialists.filter((s) => s.status === "REJECTED").length,
    };
  }, [specialists]);

  const filteredSpecialists = useMemo(() => {
    return specialists.filter((spec) => {
      if (activeTab !== "ALL" && spec.status !== activeTab) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const query = searchQuery.trim().toLowerCase();
      const profile = spec.specialistProfile;
      const matchName = spec.name.toLowerCase().includes(query);
      const matchEmail = spec.email.toLowerCase().includes(query);
      const matchPhone = spec.phone.includes(query);
      const matchCategory = profile?.category?.toLowerCase().includes(query);
      const matchArea = profile?.area?.toLowerCase().includes(query);
      const matchCompany = profile?.companyName?.toLowerCase().includes(query);
      const matchEik = profile?.eik?.includes(query);

      return Boolean(
        matchName ||
        matchEmail ||
        matchPhone ||
        matchCategory ||
        matchArea ||
        matchCompany ||
        matchEik,
      );
    });
  }, [specialists, activeTab, searchQuery]);

  const handleApprove = async (spec: User) => {
    try {
      setProcessingId(spec.id);
      await updateUserStatus(spec.id, "ACTIVE");
      setOverrideStatuses((prev) => ({ ...prev, [spec.id]: "ACTIVE" }));
      notify(`Кандидатурата на ${spec.name} е одобрена успешно.`);
    } catch {
      notify("Възникна грешка при одобряване на кандидатурата.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (spec: User) => {
    try {
      setProcessingId(spec.id);
      await updateUserStatus(spec.id, "REJECTED");
      setOverrideStatuses((prev) => ({ ...prev, [spec.id]: "REJECTED" }));
      notify(`Кандидатурата на ${spec.name} е отказана.`);
    } catch {
      notify("Възникна грешка при отказване на кандидатурата.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Quick stats cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span>Общо кандидатури</span>
          <span className={styles.statValue}>{counts.ALL}</span>
        </div>
        <div className={styles.statCard}>
          <span>Чакащи одобрение</span>
          <span className={styles.statValue} style={{ color: "#b45309" }}>
            {counts.PENDING}
          </span>
        </div>
        <div className={styles.statCard}>
          <span>Одобрени специалисти</span>
          <span className={styles.statValue} style={{ color: "var(--green)" }}>
            {counts.ACTIVE}
          </span>
        </div>
      </div>

      {/* Toolbar: tabs and search */}
      <div className={styles.toolbar}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Филтър по статус на специалист"
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={tab.label}
                className={isSelected ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.label}</span>
                <span className={styles.tabCount}>{counts[tab.key]}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.searchBox}>
          <span className={styles.searchIcon} aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търсене по име, сфера, район..."
            className={styles.searchInput}
            aria-label="Търсене на специалисти"
          />
        </div>
      </div>

      {/* Specialist application cards list */}
      <div className={styles.list}>
        {filteredSpecialists.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              📋
            </div>
            <div className={styles.emptyTitle}>
              Няма намерени кандидатури на специалисти
            </div>
            <p>
              {searchQuery
                ? "Няма резултати, отговарящи на въведените критерии за търсене."
                : activeTab === "PENDING"
                  ? "В момента няма чакащи одобрение кандидатури."
                  : activeTab === "ACTIVE"
                    ? "Все още няма одобрени специалисти."
                    : activeTab === "REJECTED"
                      ? "Няма отказани кандидатури."
                      : "Все още няма регистрирани специалисти."}
            </p>
          </div>
        ) : (
          filteredSpecialists.map((spec) => {
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
                      <h2 className={styles.authorName}>{spec.name}</h2>
                      <div className={styles.badgesRow}>
                        {profile?.category && (
                          <span className={styles.categoryBadge}>
                            {profile.category}
                          </span>
                        )}
                        {getStatusBadge(spec.status)}
                      </div>
                    </div>
                  </div>

                  <div className={styles.actionsGroup}>
                    <button
                      type="button"
                      onClick={() => handleApprove(spec)}
                      disabled={isProcessing || spec.status === "ACTIVE"}
                      className={styles.approveButton}
                    >
                      {spec.status === "ACTIVE" ? "Одобрен ✓" : "Одобри"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(spec)}
                      disabled={isProcessing || spec.status === "REJECTED"}
                      className={styles.rejectButton}
                    >
                      {spec.status === "REJECTED" ? "Отказан ✕" : "Откажи"}
                    </button>
                  </div>
                </div>

                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Имейл адрес</span>
                    <a
                      href={`mailto:${spec.email}`}
                      className={styles.detailLink}
                    >
                      {spec.email}
                    </a>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Телефонен номер</span>
                    <a href={`tel:${spec.phone}`} className={styles.detailLink}>
                      {spec.phone}
                    </a>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Сфера на дейност</span>
                    <span className={styles.detailValue}>
                      {profile?.category || "—"}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      Район на обслужване
                    </span>
                    <span className={styles.detailValue}>
                      {profile?.area || "—"}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      Професионален опит
                    </span>
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

                <div className={styles.cardFooter}>
                  <span>
                    Подадена на:{" "}
                    {new Date(spec.createdAt).toLocaleDateString("bg-BG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span>ID: {spec.id}</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
