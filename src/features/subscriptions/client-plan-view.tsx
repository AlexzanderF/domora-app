"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import {
  cancelSubscriptionAction,
  createSubscriptionAction,
} from "./server/actions";
import type { Subscription, SubscriptionPlan } from "./types";
import styles from "./client-plan.module.css";

interface ClientPlanViewProps {
  initialSubscription?: Subscription | null;
  canManageSubscriptions: boolean;
  loadError?: string;
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
  canManageSubscriptions,
  loadError,
}: ClientPlanViewProps) {
  const notify = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(
    initialSubscription ?? null,
  );
  const [propertyAddress, setPropertyAddress] = useState("");
  const [homeArea, setHomeArea] = useState("");
  const [entryFloors, setEntryFloors] = useState("");
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isSubscribed = Boolean(
    subscription && subscription.status === "ACTIVE",
  );

  async function handleSubscribe(planType: SubscriptionPlan) {
    if (isProcessing || !canManageSubscriptions) return;
    const address = propertyAddress.trim();
    const areaValue = planType === "HOME" ? homeArea : entryFloors;
    const area = Number(areaValue);
    const nextError = !address
      ? "Въведете адрес на имота."
      : !Number.isInteger(area) || area < 1 || area > 1000
        ? `Въведете ${planType === "HOME" ? "площ" : "брой етажи"} между 1 и 1000.`
        : "";

    setFormError(nextError);
    if (nextError) return;

    setIsProcessing(true);

    try {
      const result = await createSubscriptionAction({
        planType,
        propertyAddress: address,
        propertyArea: area,
      });

      if (result.success && result.subscription) {
        setSubscription(result.subscription);
        setFormError("");
        notify(`Успешно се абонирахте за план "${PLAN_NAMES[planType]}"!`);
      } else if (result.error) {
        setFormError(result.error);
        notify(result.error);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCancelSubscription() {
    if (isProcessing || !canManageSubscriptions) return;
    setIsProcessing(true);

    try {
      const result = await cancelSubscriptionAction();
      if (result.success) {
        setSubscription((prev) =>
          prev ? { ...prev, status: "CANCELLED" } : null,
        );
        notify("Абонаментът беше прекратен успешно.");
      } else if (result.error) {
        notify(result.error);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  if (!canManageSubscriptions || loadError) {
    return (
      <div className={styles.container}>
        <div className={styles.unavailableState} role="status">
          <h2>Абонаментите са временно недостъпни</h2>
          <p>
            {loadError ??
              "Не успяхме да заредим данните за вашия абонамент. Опитайте отново по-късно или се свържете с екипа на DOMORA."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isSubscribed && subscription ? (
        /* Subscribed Client View */
        <div className={styles.planCard}>
          <div className={styles.planCardHeader}>
            <div className={styles.tierInfo}>
              <span className={styles.planEyebrow}>АКТИВЕН АБОНАМЕНТ</span>
              <h2 className={styles.planName}>
                План &bdquo;{PLAN_NAMES[subscription.planType]}&ldquo;
              </h2>
              <p className={styles.planDescription}>
                {PLAN_DESCRIPTIONS[subscription.planType]}
              </p>
            </div>
            <div
              className={`${styles.statusBadge} ${
                STATUS_LABELS[subscription.status].className
              }`}
            >
              <span className={styles.statusDot} />
              <span>{STATUS_LABELS[subscription.status].label}</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricIcon}>📍</span>
              <span className={styles.metricLabel}>Адрес на имота</span>
              <span className={styles.metricValue}>
                {subscription.propertyAddress}
              </span>
              <span className={styles.metricSubtext}>Основен обект</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricIcon}>📐</span>
              <span className={styles.metricLabel}>
                {subscription.planType === "HOME"
                  ? "Площ на имота"
                  : "Брой етажи"}
              </span>
              <span className={styles.metricValue}>
                {subscription.propertyArea}{" "}
                {subscription.planType === "HOME" ? "м²" : "етажа"}
              </span>
              <span className={styles.metricSubtext}>
                Покрит обем по договор
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricIcon}>🗓️</span>
              <span className={styles.metricLabel}>Оставащи посещения</span>
              <span className={styles.metricValue}>
                {subscription.visitsRemaining} посещения
              </span>
              <span className={styles.metricSubtext}>за текущия период</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricIcon}>⏳</span>
              <span className={styles.metricLabel}>Валиден до</span>
              <span className={styles.metricValue}>
                {formatDateBulgarian(subscription.validUntil)}
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
                  {subscription.planType === "HOME"
                    ? "Периодично почистване на подове и повърхности"
                    : "Редовно хигиенизиране на стълбища и вход"}
                </span>
              </li>
              <li className={styles.coverageItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>
                  {subscription.planType === "HOME"
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
          <section
            className={styles.subscribeForm}
            aria-labelledby="subscription-property-title"
          >
            <div>
              <span className={styles.formEyebrow}>ДАННИ ЗА ИМОТА</span>
              <h3 id="subscription-property-title">
                Попълнете адрес и размер преди избор на план
              </h3>
            </div>
            <label className={styles.formField}>
              Адрес на имота
              <input
                value={propertyAddress}
                onChange={(event) => {
                  setPropertyAddress(event.target.value);
                  if (formError) setFormError("");
                }}
                placeholder="Град, улица, номер, вход"
                disabled={isProcessing}
              />
            </label>
            <div className={styles.formGrid}>
              <label className={styles.formField}>
                Площ на дома (м²)
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  value={homeArea}
                  onChange={(event) => {
                    setHomeArea(event.target.value);
                    if (formError) setFormError("");
                  }}
                  placeholder="напр. 85"
                  disabled={isProcessing}
                />
              </label>
              <label className={styles.formField}>
                Брой етажи във входа
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  value={entryFloors}
                  onChange={(event) => {
                    setEntryFloors(event.target.value);
                    if (formError) setFormError("");
                  }}
                  placeholder="напр. 6"
                  disabled={isProcessing}
                />
              </label>
            </div>
            {formError && <p className={styles.formError}>{formError}</p>}
          </section>

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
