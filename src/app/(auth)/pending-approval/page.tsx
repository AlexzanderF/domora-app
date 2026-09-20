"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import styles from "../auth.module.css";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, status, refreshUser, logout } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"info" | "success">("info");

  // If user is already ACTIVE, redirect to specialist workspace
  useEffect(() => {
    if (status === "authenticated" && user) {
      if (user.role === "SPECIALIST" && user.status === "ACTIVE") {
        router.replace("/specialist");
      }
    }
  }, [user, status, router]);

  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    setNotice(null);
    try {
      const updated = await refreshUser();
      if (updated && updated.status === "ACTIVE") {
        setNotice(
          "Поздравления! Профилът ви е одобрен. Пренасочване към работното пространство...",
        );
        setNoticeType("success");
        setTimeout(() => {
          router.push("/specialist");
        }, 1200);
      } else {
        setNotice("Кандидатурата все още се преглежда.");
        setNoticeType("info");
      }
    } catch {
      setNotice("Грешка при проверка на статуса. Моля, опитайте отново.");
      setNoticeType("info");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (status === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "36px 0" }}>
        <p style={{ color: "var(--muted)" }}>
          Зареждане на данни за профила...
        </p>
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <h1 className={styles.title}>Няма активна сесия</h1>
        <p className={styles.subtitle}>
          Моля, влезте в профила си, за да проверите статуса на вашата
          кандидатура.
        </p>
        <Link
          href="/login"
          className={styles.submitButton}
          style={{
            display: "inline-block",
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          Към вход
        </Link>
      </div>
    );
  }

  const profile = user.specialistProfile;

  return (
    <>
      <div className={styles.pendingHeader}>
        <div className={styles.pendingIconWrapper} aria-hidden="true">
          ⏳
        </div>
        <h1 className={styles.title}>Вашата кандидатура се обработва</h1>
        <div>
          <span
            className={
              user.status === "ACTIVE"
                ? styles.statusBadgeActive
                : styles.statusBadgePending
            }
          >
            {user.status === "ACTIVE" ? "✓ Одобрен" : "● Чака одобрение"}
          </span>
        </div>
      </div>

      <p
        className={styles.subtitle}
        style={{ textAlign: "center", marginBottom: "20px" }}
      >
        Благодарим ви за кандидатстването като специалист в DOMORA! Нашият екип
        разглежда вашите документи и професионална квалификация. След одобрение
        ще получите пълен достъп до специализирания панел за поръчки.
      </p>

      {notice && (
        <div
          className={
            noticeType === "success"
              ? styles.noticeBannerSuccess
              : styles.noticeBanner
          }
          role="status"
        >
          <span>{notice}</span>
        </div>
      )}

      {/* Summary card of submitted details */}
      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Подадени данни за профила</h2>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Име и фамилия</span>
          <span className={styles.summaryValue}>{user.name}</span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Сфера на дейност</span>
          <span className={styles.summaryValue}>
            {profile?.category || "Не е посочена"}
          </span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Район на обслужване</span>
          <span className={styles.summaryValue}>
            {profile?.area || "Не е посочен"}
          </span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Професионален опит</span>
          <span className={styles.summaryValue}>
            {profile?.experienceYears !== undefined
              ? `${profile.experienceYears} ${profile.experienceYears === 1 ? "година" : "години"}`
              : "0 години"}
          </span>
        </div>

        {profile?.companyName && (
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Фирма</span>
            <span className={styles.summaryValue}>{profile.companyName}</span>
          </div>
        )}

        {profile?.eik && (
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>ЕИК / БУЛСТАТ</span>
            <span className={styles.summaryValue}>{profile.eik}</span>
          </div>
        )}

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Телефонен номер</span>
          <span className={styles.summaryValue}>{user.phone}</span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Имейл адрес</span>
          <span className={styles.summaryValue}>{user.email}</span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Статус</span>
          <span className={styles.summaryValue}>
            <span
              className={
                user.status === "ACTIVE"
                  ? styles.statusBadgeActive
                  : styles.statusBadgePending
              }
            >
              {user.status === "ACTIVE" ? "✓ Одобрен" : "⏳ Чака одобрение"}
            </span>
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.buttonGroup} style={{ flexDirection: "column" }}>
        <button
          type="button"
          onClick={handleCheckStatus}
          disabled={isRefreshing}
          className={styles.submitButton}
          style={{ marginTop: 0 }}
        >
          {isRefreshing ? "Проверка..." : "Провери статус"}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className={styles.secondaryButton}
          style={{ textAlign: "center" }}
        >
          Изход
        </button>
      </div>
    </>
  );
}
