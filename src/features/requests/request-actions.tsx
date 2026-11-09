"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { transitionRequestServerAction } from "@/features/requests/server/actions";
import { canAdvance, requiresCompletionReport } from "./request-rules";
import { RequestStatus, Role } from "@/domain/requests/types";
import type { RequestAction, ServiceRequest } from "@/domain/requests/types";

export function RequestActions({
  request,
  role,
}: {
  request: ServiceRequest;
  role: Role;
}) {
  const router = useRouter();
  const notify = useToast();

  const perform = async (action: RequestAction, message: string) => {
    try {
      const res = await transitionRequestServerAction(request.id, action);
      if (!res.success) {
        notify(res.error ?? "Грешка при изпълнение на действието.");
        return;
      }
    } catch {
      notify("Грешка при изпълнение на действието. Опитайте отново.");
      return;
    }
    notify(message);
    router.refresh();
  };

  if (request.cancelled) return null;

  function advance() {
    const needsReport = requiresCompletionReport(request.status);
    const report = needsReport
      ? window.prompt("Опишете извършената работа:")
      : undefined;
    if (needsReport && !report?.trim()) return;
    void perform(
      { type: "advance", report: report ?? undefined },
      "Статусът е обновен.",
    );
  }

  return (
    <div className="actions">
      {role === Role.Client && canAdvance(request) && (
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
      {role !== Role.Client && canAdvance(request) && (
        <>
          <button className="primary" onClick={advance}>
            {request.status === RequestStatus.Created
              ? "Приеми заявката"
              : request.status === RequestStatus.InProgress
                ? "Добави отчет"
                : "Следващ статус"}
          </button>
          {request.status === RequestStatus.Created && (
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
      {role === Role.Client &&
        request.status === RequestStatus.AwaitingConfirmation && (
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
              onClick={() => {
                const note = window
                  .prompt("Опишете проблема с работата:")
                  ?.trim();
                if (!note) return;
                void perform(
                  { type: "dispute", note },
                  "Сигналът е отбелязан за преглед.",
                );
              }}
            >
              Има проблем
            </button>
          </>
        )}
      {role === Role.Client &&
        request.status === RequestStatus.Completed &&
        !request.rating && (
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
