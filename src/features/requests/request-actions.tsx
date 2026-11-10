"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { transitionRequestServerAction } from "@/features/requests/server/actions";
import { IssueDialog } from "./issue-dialog";
import {
  canAdvance,
  requiresCompletionReport,
} from "@/domain/requests/lifecycle";
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
  const [issueOpen, setIssueOpen] = useState(false);

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
    <>
      <div className="mt-[13px] flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&_button]:w-full [&_button]:text-[14px] sm:[&_button]:w-auto">
        {role === Role.Client && canAdvance(request) && (
          <Button
            variant="secondary"
            onClick={() => {
              if (window.confirm("Да отменим ли тази заявка?")) {
                void perform({ type: "cancel" }, "Заявката е отказана.");
              }
            }}
          >
            Откажи заявката
          </Button>
        )}
        {role !== Role.Client && canAdvance(request) && (
          <>
            <Button onClick={advance}>
              {request.status === RequestStatus.Created
                ? "Приеми заявката"
                : request.status === RequestStatus.InProgress
                  ? "Добави отчет"
                  : "Следващ статус"}
            </Button>
            {request.status === RequestStatus.Created && (
              <Button
                variant="secondary"
                onClick={() =>
                  void perform(
                    { type: "decline" },
                    "Заявката остава за преразпределяне.",
                  )
                }
              >
                Откажи изпълнение
              </Button>
            )}
          </>
        )}
        {role === Role.Client &&
          request.status === RequestStatus.AwaitingConfirmation && (
            <>
              <Button
                onClick={() =>
                  void perform(
                    { type: "complete" },
                    "Услугата е приключена. Можете да оставите оценка.",
                  )
                }
              >
                Потвърди приключването
              </Button>
              <Button variant="secondary" onClick={() => setIssueOpen(true)}>
                Има проблем
              </Button>
            </>
          )}
        {role === Role.Client &&
          request.status === RequestStatus.Completed &&
          !request.rating && (
            <>
              <span>Оценете:</span>
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant="ghost"
                    size="icon"
                    className="w-11! text-tone-aa761c"
                    aria-label={`${rating} звезди`}
                    onClick={() =>
                      void perform(
                        { type: "rate", rating },
                        "Благодарим за оценката!",
                      )
                    }
                  >
                    {rating}★
                  </Button>
                ))}
              </div>
            </>
          )}
        {request.rating && (
          <span className="text-[14px] text-muted-foreground">
            Оценка: {request.rating}/5 ★
          </span>
        )}
      </div>
      <IssueDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        onSubmit={(note) =>
          void perform(
            { type: "dispute", note },
            "Сигналът е отбелязан за преглед.",
          )
        }
      />
    </>
  );
}
