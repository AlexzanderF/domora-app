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
          className="flex items-start gap-4 border-b border-border py-[19px] first:pt-0 last:border-b-0 last:pb-0 max-[700px]:gap-2.5 [&_p]:mt-[5px] [&_p]:mb-2.5 [&_p]:text-[14px] [&_p]:text-muted-foreground"
          key={request.id}
          aria-label={request.service}
        >
          <div className="grid size-[42px] shrink-0 place-items-center rounded-[9px] bg-tone-f0f4ef [&_svg]:size-[22px] [&_svg]:stroke-primary">
            <ServiceIcon category={request.category} />
          </div>
          <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
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
                  <p className="border-l-[3px] border-tone-9bc092 bg-tone-ebf1e8 px-4 py-3">
                    Подаден сигнал. Очаква преглед от DOMORA.
                  </p>
                )}
              </>
            )}
          </div>
          <span className="text-[18px] font-[650] whitespace-nowrap max-[700px]:text-[16px] [&_small]:block [&_small]:text-[12px] [&_small]:font-normal">
            {money(request.price)}
            {request.plan && <small> / мес.</small>}
          </span>
        </article>
      ))}
    </>
  );
}
