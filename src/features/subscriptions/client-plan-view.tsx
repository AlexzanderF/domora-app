"use client";

import Link from "next/link";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";
import {
  cancelSubscriptionAction,
  createSubscriptionAction,
} from "./server/actions";
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/domain/subscriptions/types";
import type { Subscription } from "@/domain/subscriptions/types";

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
  ACTIVE: {
    label: "Активен",
    className: "border-tone-b3e7c5 bg-tone-e6f7ec text-tone-176536",
  },
  CANCELLED: {
    label: "Прекратен",
    className: "border-tone-d1d5db bg-tone-f3f4f6 text-tone-4b5563",
  },
  EXPIRED: {
    label: "Изтекъл",
    className: "border-tone-fde68a bg-tone-fef3c7 text-tone-92400e",
  },
};

const HOME_TIER_FEATURES = [
  "1 включено посещение от майстор месечно",
  "ВиК, електро и климатици",
  "Ключарски услуги и дребни ремонти",
  "Всяко допълнително посещение се доплаща",
];

const ENTRY_TIER_FEATURES = [
  "Хигиенизиране на стълбища, етажни площадки и входни врати",
  "Инспекция на входен автомат, домофонни системи и осветление",
  "Официален цифров отчет за домоуправителя и входа",
  "Експресна реакция при аварии по общите тръби и инсталации",
  "Прозрачни счетоводни документи за етажната собственост",
];

const planCardClass =
  "flex flex-col rounded-[16px] p-8 shadow-[0_4px_18px_rgb(0_0_0/3%)] max-[700px]:p-8";
const eyebrowClass = "font-extrabold tracking-[0.1em] text-muted-foreground";
const formFieldClass =
  "mb-0 grid gap-[0.4rem] text-[0.84rem] leading-[1.55] font-bold text-tone-40564f";
const formInputClass =
  "mt-0 min-h-11 rounded-[8px] leading-[1.55] border-tone-ccd9d1 text-[0.95rem] disabled:bg-tone-f4f6f5 disabled:text-tone-84918d";
const unavailableClass =
  "rounded-xl border-tone-f0d6a7 bg-tone-fff8ea px-6 py-5 text-tone-634716 max-[700px]:px-6 max-[700px]:py-5";

function CheckIcon() {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-tone-e6f7ec text-[1.05rem] font-extrabold text-primary">
      ✓
    </span>
  );
}

function CheckList({
  items,
  className,
  itemClassName,
}: {
  items: string[];
  className: string;
  itemClassName: string;
}) {
  return (
    <ul className={cn("m-0 list-none p-0", className)}>
      {items.map((item) => (
        <li key={item} className={cn("flex gap-[0.65rem]", itemClassName)}>
          <CheckIcon />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

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
    subscription && subscription.status === SubscriptionStatus.Active,
  );

  async function handleSubscribe(planType: SubscriptionPlan) {
    if (isProcessing || !canManageSubscriptions) return;
    const address = propertyAddress.trim();
    const areaValue =
      planType === SubscriptionPlan.Home ? homeArea : entryFloors;
    const area = Number(areaValue);
    const nextError = !address
      ? "Въведете адрес на имота."
      : !Number.isInteger(area) || area < 1 || area > 1000
        ? `Въведете ${planType === SubscriptionPlan.Home ? "площ" : "брой етажи"} между 1 и 1000.`
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
          prev ? { ...prev, status: SubscriptionStatus.Cancelled } : null,
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
      <div className="flex w-full flex-col gap-7">
        <Card role="status" className={unavailableClass}>
          <h2 className="mb-[0.35rem] text-[1rem]">
            Абонаментите са временно недостъпни
          </h2>
          <p className="m-0 text-[0.9rem] leading-normal">
            {loadError ??
              "Не успяхме да заредим данните за вашия абонамент. Опитайте отново по-късно или се свържете с екипа на DOMORA."}
          </p>
        </Card>
      </div>
    );
  }

  const isHome = subscription?.planType === SubscriptionPlan.Home;

  return (
    <div className="flex w-full flex-col gap-7">
      {isSubscribed && subscription ? (
        /* Subscribed Client View */
        <Card className={cn(planCardClass, "gap-7")}>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
            <div className="flex flex-col gap-[0.35rem]">
              <span
                className={cn(
                  eyebrowClass,
                  "text-[0.75rem] tracking-[0.12em] uppercase",
                )}
              >
                АКТИВЕН АБОНАМЕНТ
              </span>
              <h2 className="text-[1.65rem] font-extrabold text-foreground">
                План &bdquo;{PLAN_NAMES[subscription.planType]}&ldquo;
              </h2>
              <p className="m-0 text-[0.95rem] text-muted-foreground">
                {PLAN_DESCRIPTIONS[subscription.planType]}
              </p>
            </div>
            <Badge
              className={cn(
                "inline-flex items-center gap-[0.4rem] rounded-full border px-[0.9rem] py-[0.4rem] text-[0.85rem] font-bold tracking-[0.02em]",
                STATUS_LABELS[subscription.status].className,
              )}
            >
              <span className="size-2 rounded-full bg-current" />
              <span>{STATUS_LABELS[subscription.status].label}</span>
            </Badge>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {[
              {
                icon: "📍",
                label: "Адрес на имота",
                value: subscription.propertyAddress,
                subtext: "Основен обект",
              },
              {
                icon: "📐",
                label: isHome ? "Площ на имота" : "Брой етажи",
                value: `${subscription.propertyArea} ${isHome ? "м²" : "етажа"}`,
                subtext: "Покрит обем по договор",
              },
              {
                icon: "🗓️",
                label: "Оставащи посещения",
                value: `${subscription.visitsRemaining} посещения`,
                subtext: "за текущия период",
              },
              {
                icon: "⏳",
                label: "Валиден до",
                value: formatDateBulgarian(subscription.validUntil),
                subtext: "Автоматично подновяване",
              },
            ].map((metric) => (
              <Card
                key={metric.label}
                className="flex flex-col gap-[0.35rem] rounded-xl bg-background p-5"
              >
                <span className="mb-1 text-[1.25rem]">{metric.icon}</span>
                <span className="text-[0.78rem] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                  {metric.label}
                </span>
                <span className="text-[1.15rem] font-bold text-foreground">
                  {metric.value}
                </span>
                <span className="text-[0.8rem] text-muted-foreground">
                  {metric.subtext}
                </span>
              </Card>
            ))}
          </div>

          {/* Coverage and Benefits */}
          <div className="flex flex-col gap-[0.9rem]">
            <h3 className="text-[1rem] font-bold text-foreground">
              Включено във вашия абонамент
            </h3>
            <CheckList
              className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3"
              itemClassName="items-center text-[0.92rem] text-foreground"
              items={[
                isHome
                  ? "Периодично почистване на подове и повърхности"
                  : "Редовно хигиенизиране на стълбища и вход",
                isHome
                  ? "Профилактика на ВиК и електроинсталации"
                  : "Инспекция на осветление, автомати и входна врата",
                "Подробен цифров отчет след всяка визита",
                "Приоритетно обслужване при извънредни аварии",
              ]}
            />
          </div>

          {/* Plan Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
            <Button
              type="button"
              variant="secondary"
              className="rounded-[10px] border-tone-fca5a5 bg-transparent px-[1.1rem] py-[0.65rem] text-[0.85rem] text-tone-b91c1c hover:border-tone-ef4444 hover:bg-tone-fef2f2 disabled:opacity-[0.58]"
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? "Обработва се..." : "Прекрати абонамент"}
            </Button>
          </div>
        </Card>
      ) : (
        /* Unsubscribed Client View */
        <>
          <div className="flex flex-col gap-2 rounded-[16px] border border-tone-c9e0d4 bg-linear-to-br from-tone-f0f7f4 to-tone-e6f2ec px-8 py-7">
            <h2 className="text-[1.35rem] font-extrabold text-primary">
              Изберете абонаментен план за грижа и спокойствие
            </h2>
            <p className="m-0 max-w-[720px] text-[0.95rem] leading-normal text-tone-29453e">
              Абонаментите на DOMORA ви осигуряват редовна профилактика,
              поддръжка и фиксиран екип от проверени специалисти на
              преференциални цени без скрити такси.
            </p>
          </div>
          <Card
            role="region"
            aria-labelledby="subscription-property-title"
            className="grid gap-4 rounded-[14px] max-[700px]:p-6"
          >
            <div>
              <span className={cn(eyebrowClass, "text-[0.7rem]")}>
                ДАННИ ЗА ИМОТА
              </span>
              <h3
                id="subscription-property-title"
                className="mt-[0.2rem] text-[1.05rem] text-foreground"
              >
                Попълнете адрес и размер преди избор на план
              </h3>
            </div>
            <Label className={formFieldClass}>
              Адрес на имота
              <Input
                className={formInputClass}
                value={propertyAddress}
                onChange={(event) => {
                  setPropertyAddress(event.target.value);
                  if (formError) setFormError("");
                }}
                placeholder="Град, улица, номер, вход"
                disabled={isProcessing}
              />
            </Label>
            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <Label className={formFieldClass}>
                Площ на дома (м²)
                <Input
                  className={formInputClass}
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
              </Label>
              <Label className={formFieldClass}>
                Брой етажи във входа
                <Input
                  className={formInputClass}
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
              </Label>
            </div>
            {formError && (
              <p className="m-0 text-[0.82rem] font-bold text-tone-b14545">
                {formError}
              </p>
            )}
          </Card>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
            {/* Plan Tier 1: Home */}
            <TierCard
              featured
              title="За дома"
              subtitle="Едно посещение от майстор всеки месец за вашия апартамент или къща."
              priceNote="Месечна цена: предстои обявяване"
              features={HOME_TIER_FEATURES}
            >
              <Button asChild className={tierCtaClass}>
                <Link href="/plans">Разгледай абонамента</Link>
              </Button>
            </TierCard>

            {/* Plan Tier 2: Entry */}
            <TierCard
              title="За входа"
              subtitle="Цялостно решение за етажна собственост и общи части на сгради."
              price="18.00"
              unit="лв. / етаж месечно"
              features={ENTRY_TIER_FEATURES}
            >
              <Button
                type="button"
                variant="secondary"
                className={cn(
                  tierCtaClass,
                  "border-2 border-primary bg-transparent hover:bg-primary hover:text-white",
                )}
                onClick={() => handleSubscribe(SubscriptionPlan.Entry)}
                disabled={isProcessing}
              >
                {isProcessing ? "Зареждане..." : "Абонирай се за входа"}
              </Button>
            </TierCard>
          </div>
        </>
      )}
    </div>
  );
}

const tierCtaClass =
  "w-full rounded-[10px] px-5 py-[0.85rem] text-[0.95rem] font-bold hover:bg-primary hover:opacity-90 disabled:opacity-[0.58]";

function TierCard({
  featured = false,
  title,
  subtitle,
  price,
  unit,
  priceNote,
  features,
  children,
}: {
  featured?: boolean;
  title: string;
  subtitle: string;
  price?: string;
  unit?: string;
  priceNote?: string;
  features: string[];
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        planCardClass,
        "relative gap-6 transition hover:border-ring hover:shadow-[0_8px_24px_rgb(0_0_0/6%)]",
        featured && "border-primary shadow-[0_4px_20px_rgb(27_89_75/10%)]",
      )}
    >
      {featured && (
        <Badge className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-1 text-[0.75rem] font-extrabold tracking-[0.05em] text-foreground uppercase">
          Препоръчан
        </Badge>
      )}
      <div className="flex flex-col gap-2">
        <h3 className="text-[1.4rem] font-extrabold text-foreground">
          {title}
        </h3>
        <p className="m-0 text-[0.9rem] leading-[1.4] text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div className="flex items-baseline gap-[0.35rem] border-y border-border py-4">
        {priceNote ? (
          <span className="text-[0.85rem] text-muted-foreground">
            {priceNote}
          </span>
        ) : (
          <>
            <span className="text-[0.85rem] text-muted-foreground">от</span>
            <span className="text-[2rem] leading-none font-[850] text-primary">
              {price}
            </span>
            <span className="text-[0.85rem] text-muted-foreground">{unit}</span>
          </>
        )}
      </div>

      <CheckList
        className="flex grow flex-col gap-3"
        itemClassName="items-start text-[0.9rem] leading-[1.4] text-foreground"
        items={features}
      />

      {children}
    </Card>
  );
}
