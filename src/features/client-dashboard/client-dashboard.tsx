"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { useBooking } from "@/features/bookings/booking-provider";
import { transitionRequestServerAction } from "@/features/requests/server/actions";
import { RequestStatus } from "@/domain/requests/types";
import type { RequestAction, ServiceRequest } from "@/domain/requests/types";
import { categories } from "@/features/services/catalog";
import { ServiceIcon } from "@/features/services/service-icon";
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/domain/subscriptions/types";
import type { Subscription } from "@/domain/subscriptions/types";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getRecentCompletedRequests,
  getTrackerStageIndex,
  selectActiveRequest,
  trackerStages,
} from "./client-dashboard-logic";

const sectionCard = "rounded-lg p-6 max-[700px]:p-6 max-[620px]:p-[18px]";
const iconTile = "grid place-items-center bg-tone-edf3ef text-primary";
const textLink = "text-[0.8rem] font-bold text-primary";

function SectionHeading({
  eyebrow,
  id,
  title,
  children,
}: {
  eyebrow: string;
  id: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-5">
      <div>
        <span className="text-[0.68rem] font-extrabold tracking-[1.2px] text-muted-foreground">
          {eyebrow}
        </span>
        <h2 id={id} className="mt-[3px] text-[1.2rem]">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export function ClientDashboard({
  requests,
  subscription,
}: {
  requests: ServiceRequest[];
  subscription: Subscription | null;
}) {
  const { openBooking } = useBooking();
  const router = useRouter();
  const notify = useToast();
  const [ratingRequestId, setRatingRequestId] = useState<number | null>(null);
  const activeRequest = useMemo(
    () => selectActiveRequest(requests),
    [requests],
  );
  const ratingRequest = requests.find(
    (request) => request.id === ratingRequestId,
  );
  const trackedRequest = ratingRequest ?? activeRequest;
  const recentRequests = useMemo(
    () => getRecentCompletedRequests(requests),
    [requests],
  );

  async function performAction(
    request: ServiceRequest,
    action: RequestAction,
    message: string,
  ) {
    try {
      const result = await transitionRequestServerAction(request.id, action);
      if (!result.success) {
        notify(result.error ?? "Действието не беше завършено.");
        return;
      }
    } catch {
      notify("Действието не беше завършено. Опитайте отново.");
      return;
    }
    notify(message);
    router.refresh();
  }

  return (
    <div className="grid gap-5">
      <Card
        role="region"
        aria-labelledby="active-service-title"
        className={sectionCard}
      >
        <SectionHeading
          eyebrow="ТЕКУЩА ГРИЖА"
          id="active-service-title"
          title="Активна услуга"
        >
          {trackedRequest && (
            <span className="text-[0.76rem] text-muted-foreground">
              #{trackedRequest.id}
            </span>
          )}
        </SectionHeading>

        {trackedRequest ? (
          <ActiveRequest
            request={trackedRequest}
            ratingOpen={ratingRequestId === trackedRequest.id}
            onConfirm={() => {
              setRatingRequestId(trackedRequest.id);
              void performAction(
                trackedRequest,
                { type: "complete" },
                "Услугата е потвърдена. Оставете оценка.",
              );
            }}
            onIssue={() => {
              const note = window
                .prompt("Опишете проблема с работата:")
                ?.trim();
              if (!note) return;
              void performAction(
                trackedRequest,
                { type: "dispute", note },
                "Сигналът е изпратен за преглед.",
              );
            }}
            onRate={(rating) => {
              void performAction(
                trackedRequest,
                { type: "rate", rating },
                "Благодарим за оценката!",
              );
              setRatingRequestId(null);
            }}
          />
        ) : (
          <div className="flex items-center gap-3.5 bg-tone-f3f7f3 p-5">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-full bg-primary text-white"
            >
              ✓
            </span>
            <div>
              <h3 className="text-[1rem]">Всичко е наред в дома ви</h3>
              <p className="mt-[3px] mb-0 text-[0.82rem] text-muted-foreground">
                Няма активни услуги, които изискват внимание.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card
        role="region"
        aria-labelledby="quick-title"
        className={cn(sectionCard, "pt-5 max-[620px]:pt-[18px]")}
      >
        <SectionHeading
          eyebrow="НОВА УСЛУГА"
          id="quick-title"
          title="Бързо заявяване"
        >
          <span className="text-[0.76rem] text-muted-foreground">
            Изберете категория
          </span>
        </SectionHeading>
        <div className="grid grid-cols-6 gap-2.5 max-[960px]:grid-cols-3 max-[620px]:grid-cols-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant="secondary"
              className="grid min-h-[92px] min-w-0 content-center justify-items-center gap-2 rounded-[7px] border-tone-dce5df px-2 py-3 text-[0.76rem] font-bold text-tone-29453e hover:border-tone-7fa699 hover:bg-tone-f3f7f4"
              onClick={() => openBooking({ category: category.id })}
            >
              <span
                className={cn(
                  iconTile,
                  "size-[38px] rounded-[7px] [&_svg]:size-6",
                )}
              >
                <ServiceIcon category={category.id} />
              </span>
              <span>{category.name}</span>
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-5 max-[960px]:grid-cols-1">
        <Card
          role="region"
          aria-labelledby="property-title"
          className={sectionCard}
        >
          <SectionHeading
            eyebrow="ВАШИЯТ ДОМ"
            id="property-title"
            title="Абонамент & Имот"
          />
          {subscription?.status === SubscriptionStatus.Active ? (
            <SubscriptionSummary subscription={subscription} />
          ) : (
            <div className="grid gap-4">
              <h3 className="text-[1rem]">Спокойствие с абонамент</h3>
              <p className="m-0 text-[0.84rem] text-muted-foreground">
                По-ниски цени, регулярна грижа и безплатни сезонни профилактики.
              </p>
              <Button
                asChild
                variant="secondary"
                className="justify-self-start text-[0.8rem] font-bold"
              >
                <Link href="/client/plan">Разгледайте плановете</Link>
              </Button>
            </div>
          )}
        </Card>

        <Card
          role="region"
          aria-labelledby="activity-title"
          className={sectionCard}
        >
          <SectionHeading
            eyebrow="ИСТОРИЯ"
            id="activity-title"
            title="Последни дейности"
          >
            <Link href="/client/requests" className={textLink}>
              Виж всички заявки
            </Link>
          </SectionHeading>
          {recentRequests.length ? (
            <div className="grid">
              {recentRequests.map((request) => (
                <article
                  key={request.id}
                  className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-[11px] border-t border-border py-[13px] first:border-t-0 first:pt-0 max-[620px]:grid-cols-[36px_minmax(0,1fr)]"
                >
                  <span
                    className={cn(
                      iconTile,
                      "size-9 rounded-md [&_svg]:size-[19px]",
                    )}
                  >
                    <ServiceIcon category={request.category} />
                  </span>
                  <div>
                    <h3 className="text-[0.96rem]">{request.service}</h3>
                    <p className="mt-[3px] mb-0 text-[0.8rem] text-muted-foreground">
                      {request.date} · {money(request.price)}
                    </p>
                  </div>
                  <Link
                    href={`/client/requests#request-${request.id}`}
                    className={cn(textLink, "max-[620px]:col-start-2")}
                  >
                    Разписка
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[0.84rem] text-muted-foreground">
              Завършените услуги ще се появят тук.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function ActiveRequest({
  request,
  ratingOpen,
  onConfirm,
  onIssue,
  onRate,
}: {
  request: ServiceRequest;
  ratingOpen: boolean;
  onConfirm: () => void;
  onIssue: () => void;
  onRate: (rating: number) => void;
}) {
  const stage = getTrackerStageIndex(request.status);

  return (
    <div className="grid gap-[22px]">
      <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3.5 max-[620px]:grid-cols-[42px_minmax(0,1fr)]">
        <span className={cn(iconTile, "size-12 rounded-lg [&_svg]:size-6")}>
          <ServiceIcon category={request.category} />
        </span>
        <div>
          <h3 className="text-[0.96rem]">{request.service}</h3>
          <p className="mt-[3px] mb-0 text-[0.8rem] text-muted-foreground">
            {request.date} · {request.time}
            <br />
            {request.address}
          </p>
        </div>
        <strong className="text-[1.05rem] text-primary max-[620px]:col-start-2">
          {money(request.price)}
        </strong>
      </div>

      <ol
        className="m-0 grid list-none grid-cols-4 p-0 max-[620px]:grid-cols-1 max-[620px]:gap-2"
        aria-label="Прогрес на услугата"
      >
        {trackerStages.map((label, index) => {
          const reached = index <= stage;
          return (
            <li
              key={label}
              className={cn(
                "relative grid justify-items-center gap-[7px] text-center text-tone-8a9994 before:absolute before:top-3.5 before:right-1/2 before:z-0 before:h-0.5 before:w-full before:bg-border before:content-[''] first:before:hidden max-[620px]:grid-cols-[29px_minmax(0,1fr)] max-[620px]:items-center max-[620px]:justify-items-start max-[620px]:text-left max-[620px]:before:top-[-8px] max-[620px]:before:right-auto max-[620px]:before:left-3.5 max-[620px]:before:h-2 max-[620px]:before:w-0.5",
                reached && "font-bold text-primary before:bg-primary",
              )}
              aria-current={index === stage ? "step" : undefined}
            >
              <span
                className={cn(
                  "z-[1] grid size-[29px] place-items-center rounded-full border-2 border-tone-d8e1db bg-white text-[0.72rem] font-extrabold",
                  reached && "border-primary bg-primary text-white",
                )}
              >
                {index < stage ? "✓" : index + 1}
              </span>
              <small className="max-w-[120px] text-[0.69rem] max-[620px]:max-w-none">
                {label}
              </small>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between gap-4 border-t border-border pt-[18px] max-[620px]:flex-col max-[620px]:items-start">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-[34px] place-items-center rounded-full bg-tone-e9efdc font-extrabold text-primary"
            aria-hidden="true"
          >
            {request.specialist?.charAt(0) ?? "D"}
          </span>
          <div>
            <small className="block text-[0.68rem] text-muted-foreground">
              Специалист
            </small>
            <strong className="block text-[0.85rem]">
              {request.specialist ?? "Очаква разпределяне"}
            </strong>
          </div>
        </div>
        {request.specialistPhone && (
          <a href={`tel:${request.specialistPhone}`} className={textLink}>
            {request.specialistPhone}
          </a>
        )}
      </div>

      {request.status === RequestStatus.AwaitingConfirmation && !ratingOpen && (
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button" onClick={onConfirm}>
            Потвърди и оцени
          </Button>
          <Button variant="secondary" type="button" onClick={onIssue}>
            Сигнализирай проблем
          </Button>
        </div>
      )}
      {request.issue && (
        <p className="m-0 border-l-[3px] border-tone-c88c32 bg-tone-fff8ea px-3 py-2.5 text-[0.8rem] text-tone-73531e">
          Сигналът очаква преглед от DOMORA.
        </p>
      )}
      {ratingOpen && (
        <div
          className="flex flex-wrap items-center justify-between gap-2.5 rounded-md border border-tone-dce5df bg-tone-f8faf8 p-3.5"
          role="group"
          aria-label="Оценка"
        >
          <strong>Как оценявате услугата?</strong>
          <div className="flex flex-wrap items-center gap-2.5">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                type="button"
                variant="secondary"
                className="min-w-[38px] rounded-[5px] border-tone-d6dfd9 p-[7px] font-normal"
                aria-label={`${rating} звезди`}
                onClick={() => onRate(rating)}
              >
                {rating}★
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionSummary({ subscription }: { subscription: Subscription }) {
  const inspectionDate = new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(subscription.validUntil));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3 border-l-[3px] border-primary bg-tone-f3f7f4 px-3.5 py-3">
        <span className="text-[0.72rem] text-muted-foreground">
          Активен план
        </span>
        <strong className="text-[0.9rem] text-primary">
          План „
          {subscription.planType === SubscriptionPlan.Home ? "Дом" : "Вход"}“
        </strong>
      </div>
      <dl className="m-0 grid gap-3">
        {[
          ["Имот", subscription.propertyAddress],
          ["Следваща профилактика", inspectionDate],
          ["Оставащи посещения", subscription.visitsRemaining],
        ].map(([term, value]) => (
          <div key={term} className="grid gap-0.5">
            <dt className="text-[0.68rem] text-muted-foreground">{term}</dt>
            <dd className="m-0 text-[0.82rem] font-[650]">{value}</dd>
          </div>
        ))}
      </dl>
      <Link href="/client/plan" className={textLink}>
        Управление на плана
      </Link>
    </div>
  );
}
