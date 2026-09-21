"use client";

import { useToast } from "@/components/ui/toast-provider";
import { useDemo } from "./demo-provider";
import { transitionRequestServerAction } from "@/features/requests/server/actions";
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

  const perform = async (action: RequestAction, message: string) => {
    updateRequest(request.id, action, role);
    try {
      const res = await transitionRequestServerAction(request.id, action);
      if (res.mode === "db" && !res.success) {
        notify(res.error ?? "Грешка при изпълнение на действието.");
        return;
      }
    } catch {
      // Demo mode or network fallback
    }
    notify(message);
  };

  if (request.cancelled) return null;

  function advance() {
    const report =
      request.status === 3
        ? window.prompt("Опишете извършената работа:")
        : undefined;
    if (request.status === 3 && !report?.trim()) return;
    void perform(
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
            if (window.confirm("Да отменим ли тази заявка?")) {
              void perform({ type: "cancel" }, "Заявката е отказана.");
            }
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
                void perform(
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
              void perform(
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
              void perform(
                { type: "issue" },
                "Сигналът е отбелязан за преглед.",
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
                void perform(
                  { type: "rate", rating },
                  "Благодарим за оценката!",
                )
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
