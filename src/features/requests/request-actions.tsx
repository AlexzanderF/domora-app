"use client";

import { useToast } from "@/components/ui/toast-provider";
import { useDemo } from "./demo-provider";
import type { RequestAction, Role, ServiceRequest } from "./types";

export function RequestActions({
  request,
  role,
}: {
  request: ServiceRequest;
  role: Role;
}) {
  const { updateRequest } = useDemo();
  const notify = useToast();
  const perform = (action: RequestAction, message: string) => {
    updateRequest(request.id, action, role);
    notify(message);
  };
  if (request.cancelled) return null;
  function advance() {
    const report =
      request.status === 3
        ? window.prompt("Опишете извършената работа (демо отчет):")
        : undefined;
    if (request.status === 3 && !report?.trim()) return;
    perform(
      { type: "advance", report: report ?? undefined },
      "Статусът е обновен.",
    );
  }
  return (
    <div className="actions">
      {role === "client" && request.status < 4 && (
        <button
          className="secondary"
          onClick={() => {
            if (window.confirm("Да отменим ли тази демо заявка?"))
              perform({ type: "cancel" }, "Заявката е отказана.");
          }}
        >
          Откажи заявката
        </button>
      )}
      {role !== "client" && request.status < 4 && (
        <>
          <button className="primary" onClick={advance}>
            {request.status === 0
              ? "Приеми заявката"
              : request.status === 3
                ? "Добави отчет"
                : "Следващ статус"}
          </button>
          {request.status === 0 && (
            <button
              className="secondary"
              onClick={() =>
                perform(
                  { type: "decline" },
                  "Заявката остава за преразпределяне.",
                )
              }
            >
              Откажи изпълнение
            </button>
          )}
        </>
      )}
      {role === "client" && request.status === 4 && (
        <>
          <button
            className="primary"
            onClick={() =>
              perform(
                { type: "complete" },
                "Услугата е приключена. Можете да оставите оценка.",
              )
            }
          >
            Потвърди приключването
          </button>
          <button
            className="secondary"
            onClick={() =>
              perform(
                { type: "issue" },
                "Демо сигналът е отбелязан за преглед.",
              )
            }
          >
            Има проблем
          </button>
        </>
      )}
      {role === "client" && request.status === 5 && !request.rating && (
        <>
          <span>Оценете:</span>
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              className="starbutton"
              aria-label={`${rating} звезди`}
              onClick={() =>
                perform({ type: "rate", rating }, "Благодарим за оценката!")
              }
            >
              {rating}★
            </button>
          ))}
        </>
      )}
      {request.rating && (
        <span className="muted">Оценка: {request.rating}/5 ★</span>
      )}
    </div>
  );
}
