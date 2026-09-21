"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import styles from "./auth.module.css";

export function PendingApprovalCard() {
  const router = useRouter();
  const { user, status, refreshUser, logout } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"info" | "success" | "error">(
    "info",
  );

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
      } else if (updated && updated.status === "REJECTED") {
        setNotice("Кандидатурата ви е отхвърлена.");
        setNoticeType("error");
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
  const isRejected = user.status === "REJECTED";
  const isActive = user.status === "ACTIVE";

  return (
    <>
      <div className={styles.pendingHeader}>
        <div
          className={styles.pendingIconWrapper}
          style={
            isRejected ? { background: "#fee2e2", color: "#b91c1c" } : undefined
          }
          aria-hidden="true"
        >
          {isRejected ? "✕" : isActive ? "✓" : "⏳"}
        </div>
        <h1 className={styles.title}>
          {isRejected
            ? "Кандидатурата е отказана"
            : isActive
              ? "Кандидатурата е одобрена"
              : "Вашата кандидатура се обработва"}
        </h1>
        <div>
          <span
            className={
              isActive
                ? styles.statusBadgeActive
                : isRejected
                  ? styles.statusBadgeRejected
                  : styles.statusBadgePending
            }
          >
            {isActive
              ? "✓ Одобрен"
              : isRejected
                ? "✕ Отказан"
                : "● Чака одобрение"}
          </span>
        </div>
      </div>

      <p
        className={styles.subtitle}
        style={{ textAlign: "center", marginBottom: "20px" }}
      >
        {isRejected
          ? "За съжаление вашата кандидатура като специалист в DOMORA не беше одобрена. За допълнителна информация или въпроси можете да се свържете с екипа ни."
          : isActive
            ? "Профилът ви е успешно одобрен! Можете да преминете към специализираното работно пространство."
            : "Благодарим ви за кандидатстването като специалист в DOMORA! Нашият екип разглежда вашите документи и професионална квалификация. След одобрение ще получите пълен достъп до специализирания панел за поръчки."}
      </p>

      {notice && (
        <div
          className={
            noticeType === "success"
              ? styles.noticeBannerSuccess
              : noticeType === "error"
                ? styles.alertError
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
                isActive
                  ? styles.statusBadgeActive
                  : isRejected
                    ? styles.statusBadgeRejected
                    : styles.statusBadgePending
              }
            >
              {isActive
                ? "✓ Одобрен"
                : isRejected
                  ? "✕ Отказан"
                  : "⏳ Чака одобрение"}
            </span>
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.buttonGroup} style={{ flexDirection: "column" }}>
        {!isRejected && (
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isRefreshing}
            className={styles.submitButton}
            style={{ marginTop: 0 }}
          >
            {isRefreshing ? "Проверка..." : "Провери статус"}
          </button>
        )}

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
