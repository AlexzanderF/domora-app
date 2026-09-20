"use client";

import { ServiceIcon } from "@/features/services/service-icon";
import { requestStages } from "@/features/services/catalog";
import { money } from "@/lib/format";
import { useDemo } from "./demo-provider";
import { RequestActions } from "./request-actions";
import type { Role } from "./types";

export function RequestList({
  limit,
  actions = false,
  role = "client",
}: {
  limit?: number;
  actions?: boolean;
  role?: Role;
}) {
  const { requests } = useDemo();
  const items = limit ? requests.slice(0, limit) : requests;
  if (!items.length)
    return (
      <div className="empty">
        Все още няма заявки. Изберете услуга, за да започнете.
      </div>
    );
  return (
    <>
      {items.map((request) => (
        <article
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
            <span
              className={`badge ${request.status === 0 && !request.cancelled ? "wait" : ""}`}
            >
              {request.cancelled ? "Отказана" : requestStages[request.status]}
            </span>{" "}
            {request.plan && (
              <span className="badge">
                {request.visitsPerMonth && request.propertySize
                  ? `${request.visitsPerMonth} ${request.visitsPerMonth === 1 ? "посещение" : "посещения"} / месец · ${request.propertySize} ${request.plan === "home" ? "м²" : "етажа"}`
                  : request.plan === "home"
                    ? "За дома"
                    : "За входа"}
              </span>
            )}
            {actions && (
              <>
                <p>{request.master || "Очаква разпределяне към специалист"}</p>
                {request.report && <p>Отчет: {request.report}</p>}
                <RequestActions request={request} role={role} />
                {request.issue && (
                  <p className="notice">
                    Подаден демо сигнал. Очаква преглед от DOMORA.
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
