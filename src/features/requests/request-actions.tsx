"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import {
  adminAssignSpecialistAction,
  adminRecommendSpecialistAction,
  assignSpecialistAction,
  cancelRequestAction,
  completeWorkAction,
  confirmCompletionAction,
  declineRecommendationAction,
  raiseDisputeAction,
  rateRequestAction,
  releaseRequestAction,
  startWorkAction,
  type ServiceRequestActionResult,
} from "@/features/requests/server/actions";
import { UserStatus } from "@/domain/identity/types";
import type { User } from "@/domain/identity/types";
import { IssueDialog } from "./issue-dialog";
import type { ServiceRequest } from "@/domain/requests/types";

// Renders only the actions the server sent with the request. `specialists` is
// passed on the Administrator's screen: it makes the cancel button say whose
// request it cancels and powers the assign and recommend controls.
export function RequestActions({
  request,
  specialists,
}: {
  request: ServiceRequest;
  specialists?: User[];
}) {
  const router = useRouter();
  const notify = useToast();
  const [issueOpen, setIssueOpen] = useState(false);
  const [specialistId, setSpecialistId] = useState("");
  const asAdmin = specialists !== undefined;
  const can = (kind: ServiceRequest["actions"][number]) =>
    request.actions.includes(kind);

  const perform = async (
    run: () => Promise<ServiceRequestActionResult>,
    message: string,
  ) => {
    try {
      const res = await run();
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

  const dispatch = async (
    run: typeof adminAssignSpecialistAction,
    message: string,
  ) => {
    if (!specialistId) {
      notify("Първо изберете специалист от падащия списък.");
      return;
    }
    try {
      const res = await run(request.id, Number(specialistId));
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
    void perform(
      () => completeWorkAction(request.id, report),
      "Статусът е обновен.",
    );
  }

  return (
    <>
      <div className="mt-[13px] flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&_button]:w-full [&_button]:text-[14px] sm:[&_button]:w-auto">
        {can("cancel") && (
          <Button
            variant="secondary"
            onClick={() => {
              if (
                window.confirm(
                  asAdmin
                    ? "Да отменим ли заявката на клиента?"
                    : "Да отменим ли тази заявка?",
                )
              ) {
                void perform(
                  () => cancelRequestAction(request.id),
                  "Заявката е отказана.",
                );
              }
            }}
          >
            {asAdmin ? "Откажи заявката на клиента" : "Откажи заявката"}
          </Button>
        )}
        {(can("assign") || can("recommend")) && (
          <>
            <select
              className="rounded-lg border border-border px-3 py-2 text-[14px]"
              value={specialistId}
              onChange={(e) => setSpecialistId(e.target.value)}
              aria-label={`Избор на специалист за ${request.service}`}
            >
              <option value="">Избери специалист…</option>
              {(specialists ?? [])
                .filter((s) => s.status === UserStatus.Active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.specialistProfile?.category
                      ? ` · ${s.specialistProfile.category}`
                      : ""}
                  </option>
                ))}
            </select>
            {can("assign") && (
              <Button
                onClick={() =>
                  void dispatch(
                    adminAssignSpecialistAction,
                    "Заявката е разпределена към специалиста.",
                  )
                }
              >
                Разпредели
              </Button>
            )}
            {can("recommend") && (
              <Button
                variant="secondary"
                onClick={() =>
                  void dispatch(
                    adminRecommendSpecialistAction,
                    "Заявката е препоръчана на специалиста.",
                  )
                }
              >
                Препоръчай
              </Button>
            )}
          </>
        )}
        {can("claim") && (
          <Button
            onClick={() =>
              void perform(
                () => assignSpecialistAction(request.id),
                "Статусът е обновен.",
              )
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
                () => declineRecommendationAction(request.id),
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
              void perform(
                () => startWorkAction(request.id),
                "Статусът е обновен.",
              )
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
                () => releaseRequestAction(request.id),
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
                () => confirmCompletionAction(request.id),
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
                      () => rateRequestAction(request.id, rating),
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
            () => raiseDisputeAction(request.id, note),
            "Сигналът е отбелязан за преглед.",
          )
        }
      />
    </>
  );
}
