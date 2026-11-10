"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { transitionRequestServerAction } from "@/features/requests/server/actions";
import { IssueDialog } from "./issue-dialog";
import type { RequestAction, ServiceRequest } from "@/domain/requests/types";

// Renders only the actions the server sent with the request.
export function RequestActions({ request }: { request: ServiceRequest }) {
  const router = useRouter();
  const notify = useToast();
  const [issueOpen, setIssueOpen] = useState(false);
  const can = (kind: ServiceRequest["actions"][number]) =>
    request.actions.includes(kind);

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

  function submitReport() {
    const report = window.prompt("Опишете извършената работа:");
    if (!report?.trim()) return;
    void perform({ type: "advance", report }, "Статусът е обновен.");
  }

  return (
    <>
      <div className="mt-[13px] flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&_button]:w-full [&_button]:text-[14px] sm:[&_button]:w-auto">
        {can("cancel") && (
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
        {can("claim") && (
          <Button
            onClick={() =>
              void perform({ type: "advance" }, "Статусът е обновен.")
            }
          >
            Приеми заявката
          </Button>
        )}
        {can("declineRecommendation") && (
          <Button
            variant="secondary"
            onClick={() =>
              void perform(
                { type: "decline" },
                "Заявката остава за преразпределяне.",
              )
            }
          >
            Откажи препоръката
          </Button>
        )}
        {can("start") && (
          <Button
            onClick={() =>
              void perform({ type: "advance" }, "Статусът е обновен.")
            }
          >
            Започни работа
          </Button>
        )}
        {can("submitReport") && (
          <Button onClick={submitReport}>Добави отчет</Button>
        )}
        {can("release") && (
          <Button
            variant="secondary"
            onClick={() =>
              void perform(
                { type: "cancel" },
                "Заявката се върна за преразпределяне.",
              )
            }
          >
            Откажи изпълнение
          </Button>
        )}
        {can("confirm") && (
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
        )}
        {can("dispute") && (
          <Button variant="secondary" onClick={() => setIssueOpen(true)}>
            Има проблем
          </Button>
        )}
        {can("rate") && (
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
