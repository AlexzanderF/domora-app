"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { useDemo } from "@/features/requests/demo-provider";
import { transitionRequestServerAction } from "@/features/requests/server/actions";
import { transitionRequest } from "@/features/requests/transitions";
import { RequestStatus, Role } from "@/features/requests/types";
import type { RequestAction, ServiceRequest } from "@/features/requests/types";
import { categories } from "@/features/services/catalog";
import { ServiceIcon } from "@/features/services/service-icon";
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/features/subscriptions/types";
import type { Subscription } from "@/features/subscriptions/types";
import { money } from "@/lib/format";
import {
  getRecentCompletedRequests,
  getTrackerStageIndex,
  selectActiveRequest,
  trackerStages,
} from "./client-dashboard-logic";
import styles from "./client-dashboard.module.css";

export function ClientDashboard({
  initialRequests,
  initialSubscription,
  isDbMode,
}: {
  initialRequests: ServiceRequest[] | null;
  initialSubscription: Subscription | null;
  isDbMode: boolean;
}) {
  const demo = useDemo();
  const notify = useToast();
  const [serverRequests, setServerRequests] = useState(initialRequests);
  const [ratingRequestId, setRatingRequestId] = useState<number | null>(null);
  const requests = serverRequests ?? demo.requests;
  const subscription = isDbMode ? initialSubscription : demo.subscription;
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

  function updateLocally(id: number, action: RequestAction) {
    if (serverRequests) {
      setServerRequests(
        (current) =>
          current?.map((request) =>
            request.id === id
              ? transitionRequest(request, action, Role.Client)
              : request,
          ) ?? null,
      );
    } else {
      demo.updateRequest(id, action, Role.Client);
    }
  }

  async function performAction(
    request: ServiceRequest,
    action: RequestAction,
    message: string,
  ) {
    updateLocally(request.id, action);
    try {
      const result = await transitionRequestServerAction(request.id, action);
      if (result.mode === "db" && !result.success) {
        notify(result.error ?? "Действието не беше завършено.");
        return;
      }
    } catch {
      // The optimistic demo state remains available without a configured database.
    }
    notify(message);
  }

  return (
    <div className={styles.dashboard}>
      <section
        className={styles.tracker}
        aria-labelledby="active-service-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>ТЕКУЩА ГРИЖА</span>
            <h2 id="active-service-title">Активна услуга</h2>
          </div>
          {trackedRequest && (
            <span className={styles.requestNumber}>#{trackedRequest.id}</span>
          )}
        </div>

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
            onIssue={() =>
              void performAction(
                trackedRequest,
                { type: "issue" },
                "Сигналът е изпратен за преглед.",
              )
            }
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
          <div className={styles.calmState}>
            <span aria-hidden="true">✓</span>
            <div>
              <h3>Всичко е наред в дома ви</h3>
              <p>Няма активни услуги, които изискват внимание.</p>
            </div>
          </div>
        )}
      </section>

      <section className={styles.quickBooking} aria-labelledby="quick-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>НОВА УСЛУГА</span>
            <h2 id="quick-title">Бързо заявяване</h2>
          </div>
          <span className={styles.sectionHint}>Изберете категория</span>
        </div>
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => demo.openBooking({ category: category.id })}
            >
              <span className={styles.categoryIcon}>
                <ServiceIcon category={category.id} />
              </span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.lowerGrid}>
        <section className={styles.property} aria-labelledby="property-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>ВАШИЯТ ДОМ</span>
              <h2 id="property-title">Абонамент & Имот</h2>
            </div>
          </div>
          {subscription?.status === SubscriptionStatus.Active ? (
            <SubscriptionSummary subscription={subscription} />
          ) : (
            <div className={styles.subscriptionOffer}>
              <h3>Спокойствие с абонамент</h3>
              <p>
                По-ниски цени, регулярна грижа и безплатни сезонни профилактики.
              </p>
              <Link className="secondary" href="/client/plan">
                Разгледайте плановете
              </Link>
            </div>
          )}
        </section>

        <section className={styles.activity} aria-labelledby="activity-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>ИСТОРИЯ</span>
              <h2 id="activity-title">Последни дейности</h2>
            </div>
            <Link href="/client/requests">Виж всички заявки</Link>
          </div>
          {recentRequests.length ? (
            <div className={styles.activityList}>
              {recentRequests.map((request) => (
                <article key={request.id}>
                  <span className={styles.activityIcon}>
                    <ServiceIcon category={request.category} />
                  </span>
                  <div>
                    <h3>{request.service}</h3>
                    <p>
                      {request.date} · {money(request.price)}
                    </p>
                  </div>
                  <Link href={`/client/requests#request-${request.id}`}>
                    Разписка
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyActivity}>
              Завършените услуги ще се появят тук.
            </p>
          )}
        </section>
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
    <div className={styles.activeContent}>
      <div className={styles.activeSummary}>
        <span className={styles.activeIcon}>
          <ServiceIcon category={request.category} />
        </span>
        <div>
          <h3>{request.service}</h3>
          <p>
            {request.date} · {request.time}
            <br />
            {request.address}
          </p>
        </div>
        <strong>{money(request.price)}</strong>
      </div>

      <ol className={styles.progress} aria-label="Прогрес на услугата">
        {trackerStages.map((label, index) => (
          <li
            key={label}
            className={index <= stage ? styles.progressActive : undefined}
            aria-current={index === stage ? "step" : undefined}
          >
            <span>{index < stage ? "✓" : index + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>

      <div className={styles.specialistRow}>
        <div>
          <span className={styles.specialistAvatar} aria-hidden="true">
            {request.specialist?.charAt(0) ?? "D"}
          </span>
          <div>
            <small>Специалист</small>
            <strong>{request.specialist ?? "Очаква разпределяне"}</strong>
          </div>
        </div>
        {request.specialistPhone && (
          <a href={`tel:${request.specialistPhone}`}>
            {request.specialistPhone}
          </a>
        )}
      </div>

      {request.status === RequestStatus.AwaitingConfirmation && !ratingOpen && (
        <div className={styles.trackerActions}>
          <button className="primary" type="button" onClick={onConfirm}>
            Потвърди и оцени
          </button>
          <button className="secondary" type="button" onClick={onIssue}>
            Сигнализирай проблем
          </button>
        </div>
      )}
      {request.issue && (
        <p className={styles.issueNotice}>Сигналът очаква преглед от DOMORA.</p>
      )}
      {ratingOpen && (
        <div className={styles.rating} role="group" aria-label="Оценка">
          <strong>Как оценявате услугата?</strong>
          <div>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                aria-label={`${rating} звезди`}
                onClick={() => onRate(rating)}
              >
                {rating}★
              </button>
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
    <div className={styles.subscriptionSummary}>
      <div className={styles.planName}>
        <span>Активен план</span>
        <strong>
          План „
          {subscription.planType === SubscriptionPlan.Home ? "Дом" : "Вход"}“
        </strong>
      </div>
      <dl>
        <div>
          <dt>Имот</dt>
          <dd>{subscription.propertyAddress}</dd>
        </div>
        <div>
          <dt>Следваща профилактика</dt>
          <dd>{inspectionDate}</dd>
        </div>
        <div>
          <dt>Оставащи посещения</dt>
          <dd>{subscription.visitsRemaining}</dd>
        </div>
      </dl>
      <Link href="/client/plan">Управление на плана</Link>
    </div>
  );
}
