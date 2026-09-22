"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { useDemo } from "@/features/requests/demo-provider";
import {
  cancelSubscriptionAction,
  createSubscriptionAction,
} from "./server/actions";
import type { Subscription, SubscriptionPlan } from "./types";
import styles from "./client-plan.module.css";

interface ClientPlanViewProps {
  initialSubscription?: Subscription | null;
  isDbMode?: boolean;
}

const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  HOME: "За дома",
  ENTRY: "За входа",
};

const PLAN_DESCRIPTIONS: Record<SubscriptionPlan, string> = {
  HOME: "Редовна грижа и профилактика за вашия апартамент или къща.",
  ENTRY: "Постоянна грижа и хигиена за общите части на сградата.",
};

const STATUS_LABELS: Record<
  Subscription["status"],
  { label: string; className: string }
> = {
  ACTIVE: { label: "Активен", className: styles.statusActive },
  CANCELLED: { label: "Прекратен", className: styles.statusCancelled },
  EXPIRED: { label: "Изтекъл", className: styles.statusExpired },
};

function formatDateBulgarian(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("bg-BG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function ClientPlanView({
  initialSubscription,
  isDbMode = false,
}: ClientPlanViewProps) {
  const notify = useToast();
  const demo = useDemo();
  const [dbSubscription, setDbSubscription] = useState<Subscription | null>(
    initialSubscription ?? null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // In DB mode, use DB subscription; in demo mode, use demo provider subscription
  const currentSubscription = isDbMode ? dbSubscription : demo.subscription;
  const isSubscribed = Boolean(
    currentSubscription && currentSubscription.status === "ACTIVE",
  );

  async function handleSubscribe(planType: SubscriptionPlan) {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (isDbMode) {
        const address = "София · ул. Примерна 12, ет. 3, ап. 8";
        const area = planType === "HOME" ? 85 : 6;
        const result = await createSubscriptionAction({
          planType,
          propertyAddress: address,
          propertyArea: area,
        });

        if (result.success && result.subscription) {
          setDbSubscription(result.subscription);
          notify(`Успешно се абонирахте за план "${PLAN_NAMES[planType]}"!`);
        } else if (result.error) {
          notify(result.error);
        }
      } else {
        demo.subscribePlan(planType);
        notify(`Успешно се абонирахте за план "${PLAN_NAMES[planType]}"!`);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCancelSubscription() {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (isDbMode) {
        const result = await cancelSubscriptionAction();
        if (result.success) {
          setDbSubscription((prev) =>
            prev ? { ...prev, status: "CANCELLED" } : null,
          );
          notify("Абонаментът беше прекратен успешно.");
        } else if (result.error) {
          notify(result.error);
        }
      } else {
        demo.cancelSubscription();
        notify("Абонаментът беше прекратен успешно.");
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDemoToggle() {
    if (isDbMode) {
      if (dbSubscription?.status === "ACTIVE") {
        setDbSubscription(null);
        notify("Превключено към неабониран профил (демо изглед).");
      } else {
        setDbSubscription({
          id: 9999,
          userId: 1,
          planType: "HOME",
          propertyAddress: "София · ул. Примерна 12, ап. 5",
          propertyArea: 85,
          status: "ACTIVE",
          visitsRemaining: 3,
          validUntil: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        notify("Превключено към абониран профил (демо изглед).");
      }
    } else {
      if (demo.subscription?.status === "ACTIVE") {
        demo.setSubscription(null);
        notify("Превключено към неабониран профил (демо изглед).");
      } else {
        demo.subscribePlan("HOME");
        notify("Превключено към абониран профил (демо изглед).");
      }
    }
  }

  return (
    <div className={styles.container}>
      {/* Demo helper banner */}
      <div className={styles.demoBanner}>
        <div className={styles.demoBannerText}>
          <span className={styles.demoBadge}>Демо режим</span>
          <span>
            {isSubscribed
              ? "Разглеждате профила като абониран клиент."
              : "Разглеждате профила като клиент без активен абонамент."}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDemoToggle}
          className={styles.demoButton}
        >
          {isSubscribed
            ? "Превключи към неабониран изглед"
            : "Превключи към абониран изглед"}
        </button>
      </div>

      {isSubscribed && currentSubscription ? (
        /* Subscribed Client View */
        <div className={styles.planCard}>
          <div className={styles.planCardHeader}>
            <div className={styles.tierInfo}>
              <span className={styles.planEyebrow}>АКТИВЕН АБОНАМЕНТ</span>
              <h2 className={styles.planName}>
                План &bdquo;{PLAN_NAMES[currentSubscription.planType]}&ldquo;
              </h2>
              <p className={styles.planDescription}>
                {PLAN_DESCRIPTIONS[currentSubscription.planType]}
              </p>
            </div>
            <div
              className={`${styles.statusBadge} ${
                STATUS_LABELS[currentSubscription.status].className
              }`}
            >
              <span className={styles.statusDot} />
              <span>{STATUS_LABELS[currentSubscription.status].label}</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricIcon}>📍</span>
              <span className={styles.metricLabel}>Адрес на имота</span>
              <span className={styles.metricValue}>
                {currentSubscription.propertyAddress}
              </span>
              <span className={styles.metricSubtext}>Основен обект</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricIcon}>📐</span>
              <span className={styles.metricLabel}>
                {currentSubscription.planType === "HOME"
                  ? "Площ на имота"
                  : "Брой етажи"}
              </span>
              <span className={styles.metricValue}>
                {currentSubscription.propertyArea}{" "}
                {currentSubscription.planType === "HOME" ? "м²" : "етажа"}
              </span>
              <span className={styles.metricSubtext}>
                Покрит обем по договор
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricIcon}>🗓️</span>
              <span className={styles.metricLabel}>Оставащи посещения</span>
              <span className={styles.metricValue}>
                {currentSubscription.visitsRemaining} посещения
              </span>
              <span className={styles.metricSubtext}>за текущия период</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricIcon}>⏳</span>
              <span className={styles.metricLabel}>Валиден до</span>
              <span className={styles.metricValue}>
                {formatDateBulgarian(currentSubscription.validUntil)}
              </span>
              <span className={styles.metricSubtext}>
                Автоматично подновяване
              </span>
            </div>
          </div>

          {/* Coverage and Benefits */}
          <div className={styles.coverageSection}>
            <h3 className={styles.sectionTitle}>
              Включено във вашия абонамент
            </h3>
            <ul className={styles.coverageList}>
              <li className={styles.coverageItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>
                  {currentSubscription.planType === "HOME"
                    ? "Периодично почистване на подове и повърхности"
                    : "Редовно хигиенизиране на стълбища и вход"}
                </span>
              </li>
              <li className={styles.coverageItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>
                  {currentSubscription.planType === "HOME"
                    ? "Профилактика на ВиК и електроинсталации"
                    : "Инспекция на осветление, автомати и входна врата"}
                </span>
              </li>
              <li className={styles.coverageItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Подробен цифров отчет след всяка визита</span>
              </li>
              <li className={styles.coverageItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Приоритетно обслужване при извънредни аварии</span>
              </li>
            </ul>
          </div>

          {/* Plan Actions */}
          <div className={styles.planActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                demo.openBooking({
                  category: 4,
                  plan:
                    currentSubscription.planType === "HOME" ? "home" : "entry",
                });
              }}
            >
              <span>📅</span>
              <span>Заяви посещение по абонамент</span>
            </button>

            <button
              type="button"
              className={styles.dangerOutlineButton}
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? "Обработва се..." : "Прекрати абонамент"}
            </button>
          </div>
        </div>
      ) : (
        /* Unsubscribed Client View */
        <>
          <div className={styles.introBanner}>
            <h2>Изберете абонаментен план за грижа и спокойствие</h2>
            <p>
              Абонаментите на DOMORA ви осигуряват редовна профилактика,
              поддръжка и фиксиран екип от проверени специалисти на
              преференциални цени без скрити такси.
            </p>
          </div>

          <div className={styles.plansGrid}>
            {/* Plan Tier 1: Home */}
            <div className={`${styles.tierCard} ${styles.tierFeatured}`}>
              <span className={styles.featuredBadge}>Препоръчан</span>
              <div className={styles.tierHeader}>
                <h3 className={styles.tierTitle}>За дома</h3>
                <p className={styles.tierSubtitle}>
                  Идеален за апартаменти и еднофамилни къщи с редовна поддръжка.
                </p>
              </div>

              <div className={styles.pricingBlock}>
                <span className={styles.priceFrom}>от</span>
                <span className={styles.priceNumber}>1.50</span>
                <span className={styles.priceUnit}>лв. / м² месечно</span>
              </div>

              <ul className={styles.tierFeatures}>
                <li className={styles.tierFeatureItem}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>
                    Редовно почистване на подове, санитарни възли и кухня
                  </span>
                </li>
                <li className={styles.tierFeatureItem}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>
                    Периодичен технически оглед на ВиК и електроинсталации
                  </span>
                </li>
                <li className={styles.tierFeatureItem}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>
                    Детайлен доклад и снимков отчет след всяко посещение
                  </span>
                </li>
                <li className={styles.tierFeatureItem}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>
                    15% постоянна отстъпка за всички извънредни ремонтни
                    дейности
                  </span>
                </li>
                <li className={styles.tierFeatureItem}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>
                    Приоритетен график и фиксирани доверени специалисти
                  </span>
                </li>
              </ul>

              <button
                type="button"
                className={styles.subscribeCta}
                onClick={() => handleSubscribe("HOME")}
                disabled={isProcessing}
              >
                {isProcessing ? "Зареждане..." : "Абонирай се за дома"}
              </button>
            </div>

            {/* Plan Tier 2: Entry */}
            <div className={styles.tierCard}>
              <div className={styles.tierHeader}>
                <h3 className={styles.tierTitle}>За входа</h3>
                <p className={styles.tierSubtitle}>
                  Цялостно решение за етажна собственост и общи части на сгради.
                </p>
              </div>

              <div className={styles.pricingBlock}>
                <span className={styles.priceFrom}>от</span>
                <span className={styles.priceNumber}>18.00</span>
                <span className={styles.priceUnit}>лв. / етаж месечно</span>
              </div>

              <ul className={styles.tierFeatures}>
                <li className={styles.tierFeatureItem}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>
                    Хигиенизиране на стълбища, етажни площадки и входни врати
                  </span>
                </li>
                <li className={styles.tierFeatureItem}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>
                    Инспекция на входен автомат, домофонни системи и осветление
                  </span>
                </li>
                <li className={styles.tierFeatureItem}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>Официален цифров отчет за домоуправителя и входа</span>
                </li>
                <li className={styles.tierFeatureItem}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>
                    Експресна реакция при аварии по общите тръби и инсталации
                  </span>
                </li>
                <li className={styles.tierFeatureItem}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>
                    Прозрачни счетоводни документи за етажната собственост
                  </span>
                </li>
              </ul>

              <button
                type="button"
                className={styles.subscribeCtaOutline}
                onClick={() => handleSubscribe("ENTRY")}
                disabled={isProcessing}
              >
                {isProcessing ? "Зареждане..." : "Абонирай се за входа"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
