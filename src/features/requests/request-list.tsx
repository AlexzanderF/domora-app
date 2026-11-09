"use client";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { ServiceIcon } from "@/features/services/service-icon";
import { requestStages } from "@/features/services/catalog";
import { money } from "@/lib/format";
import { ReportPhotos } from "./report-photos";
import { RequestActions } from "./request-actions";
import { Plan, RequestStatus, Role } from "@/domain/requests/types";
import type { ServiceRequest } from "@/domain/requests/types";

export function RequestList({
  limit,
  actions = false,
  role = Role.Client,
  initialRequests,
}: {
  limit?: number;
  actions?: boolean;
  role?: Role;
  initialRequests: ServiceRequest[];
}) {
  const items = limit ? initialRequests.slice(0, limit) : initialRequests;
  if (!items.length)
    return (
      <EmptyState>
        Все още няма заявки. Изберете услуга, за да започнете.
      </EmptyState>
    );
  return (
    <>
      {items.map((request) => (
        <article
          id={`request-${request.id}`}
          className="request"
          key={request.id}
          aria-label={request.service}
        >
          <div className="tinyicon">
            <ServiceIcon category={request.category} />
          </div>
          <div className="requestinfo">
            <h3>{request.service}</h3>
            <p>
              {request.date} · {request.time}
              <br />
              {request.address}
            </p>
            <StatusBadge
              tone={
                request.status === RequestStatus.Created && !request.cancelled
                  ? "pending"
                  : "default"
              }
            >
              {request.cancelled ? "Отказана" : requestStages[request.status]}
            </StatusBadge>{" "}
            {request.plan && (
              <StatusBadge>
                {request.visitsPerMonth && request.propertySize
                  ? `${request.visitsPerMonth} ${request.visitsPerMonth === 1 ? "посещение" : "посещения"} / месец · ${request.propertySize} ${request.plan === Plan.Home ? "м²" : "етажа"}`
                  : request.plan === Plan.Home
                    ? "За дома"
                    : "За входа"}
              </StatusBadge>
            )}
            {actions && (
              <>
                <p>
                  {request.specialist || "Очаква разпределяне към специалист"}
                </p>
                {request.report && <p>Отчет: {request.report}</p>}
                <ReportPhotos photoIds={request.reportPhotoIds} />
                <RequestActions request={request} role={role} />
                {request.issue && (
                  <p className="notice">
                    Подаден сигнал. Очаква преглед от DOMORA.
                  </p>
                )}
              </>
            )}
          </div>
          <span className="amount">
            {money(request.price)}
            {request.plan && <small> / мес.</small>}
          </span>
        </article>
      ))}
    </>
  );
}
