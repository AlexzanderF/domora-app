"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { transitionRequestServerAction } from "@/features/requests/server/actions";
import { useToast } from "@/components/ui/toast-provider";
import { categories, requestStages } from "@/features/services/catalog";
import { ReportPhotos } from "@/features/requests/report-photos";
import { money } from "@/lib/format";
import type { ResolvedDispute } from "./server/queries";
import type { ServiceRequest } from "@/domain/requests/types";
import { Button } from "@/components/ui/button";
import {
  CardHeaderRow,
  CategoryPill,
  DetailGrid,
  DetailItem,
  DetailValue,
  QueueEmpty,
} from "./admin-ui";

export interface DisputedRequestsQueueProps {
  initialDisputedRequests?: ServiceRequest[] | null;
  resolvedDisputes?: ResolvedDispute[] | null;
}

export function DisputedRequestsQueue({
  initialDisputedRequests,
  resolvedDisputes,
}: DisputedRequestsQueueProps = {}) {
  const notify = useToast();
  const router = useRouter();
  const [resolvedIds, setResolvedIds] = useState<Set<number>>(new Set());
  const [processingId, setProcessingId] = useState<number | null>(null);

  const disputed = useMemo(() => {
    const source = initialDisputedRequests ?? [];
    return source.filter((r) => r.issue && !resolvedIds.has(r.id));
  }, [initialDisputedRequests, resolvedIds]);

  const handleResolve = async (request: ServiceRequest) => {
    // Cancel aborts; an empty answer resolves without a note.
    const resolutionNote = window.prompt("Как е решен сигналът? (по желание)");
    if (resolutionNote === null) return;
    try {
      setProcessingId(request.id);
      const res = await transitionRequestServerAction(request.id, {
        type: "resolve-dispute",
        resolutionNote,
      });
      if (!res.success) {
        notify(res.error ?? "Възникна грешка при разрешаване на сигнала.");
        return;
      }
      setResolvedIds((prev) => new Set(prev).add(request.id));
      notify("Сигналът е маркиран като решен.");
      router.refresh();
    } catch {
      notify("Възникна грешка при разрешаване на сигнала.");
    } finally {
      setProcessingId(null);
    }
  };

  const history = <ResolvedHistory disputes={resolvedDisputes ?? []} />;

  if (disputed.length === 0) {
    return (
      <>
        <QueueEmpty
          icon="✅"
          title="Няма активни сигнали за проблеми"
          description="Всички оспорвания между клиенти и специалисти са разрешени."
        />
        {history}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {disputed.map((request) => {
        const categoryName =
          categories.find((c) => c.id === request.category)?.name ?? "Друго";
        const isProcessing = processingId === request.id;

        return (
          <article
            key={request.id}
            className="rounded-[10px] border border-tone-fde7c7 bg-tone-fffaf5 px-5 py-[18px]"
            aria-label={request.service}
          >
            <CardHeaderRow className="max-md:flex-col max-md:items-stretch">
              <div>
                <h3 className="m-0 mb-1.5 text-base font-bold text-foreground">
                  {request.service}
                </h3>
                <div className="flex flex-wrap items-center gap-2.5">
                  <CategoryPill>{categoryName}</CategoryPill>
                  <span className="text-xs text-muted-foreground">
                    {request.date} · {request.time}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => handleResolve(request)}
                disabled={isProcessing}
                className="px-4 py-[7px] text-[13px] whitespace-nowrap"
              >
                Маркирай като решен
              </Button>
            </CardHeaderRow>

            <DetailGrid className="mt-4 border-tone-f2e5cf">
              <DetailItem label="Назначен специалист">
                <DetailValue>
                  {request.specialist || "Няма назначен специалист"}
                </DetailValue>
              </DetailItem>
              <DetailItem label="Клиент">
                <DetailValue>
                  {request.clientName || "—"}
                  {request.clientPhone ? ` · ${request.clientPhone}` : ""}
                </DetailValue>
              </DetailItem>
              <DetailItem label="Статус на изпълнение">
                <DetailValue>{requestStages[request.status]}</DetailValue>
              </DetailItem>
              <DetailItem label="Стойност">
                <DetailValue>{money(request.price)}</DetailValue>
              </DetailItem>
            </DetailGrid>

            <div className="mt-3.5 border-t border-tone-f2e5cf pt-3">
              <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.5px] text-tone-b45309 uppercase">
                Описание на проблема (от клиента)
              </span>
              <p className="m-0 text-[13px] leading-normal text-foreground">
                {request.issueNote ?? request.description}
              </p>
            </div>

            {request.report && (
              <div className="mt-3.5 border-t border-tone-f2e5cf pt-3">
                <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.5px] text-tone-b45309 uppercase">
                  Отчет от специалиста
                </span>
                <p className="m-0 text-[13px] leading-normal text-foreground">
                  {request.report}
                </p>
                <ReportPhotos photoIds={request.reportPhotoIds} />
              </div>
            )}
          </article>
        );
      })}
      {history}
    </div>
  );
}

function ResolvedHistory({ disputes }: { disputes: ResolvedDispute[] }) {
  if (disputes.length === 0) return null;
  return (
    <section className="mt-[18px]" aria-label="История на решените сигнали">
      <h3 className="m-0 mb-2.5 text-sm font-bold text-foreground">
        История на решените сигнали
      </h3>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {disputes.map((dispute) => (
          <li
            key={dispute.id}
            className="rounded-lg border border-tone-d8e4d9 bg-tone-f7faf7 px-3.5 py-3 text-[13px]"
          >
            <strong>
              #{dispute.requestId} · {dispute.service}
            </strong>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {dispute.clientName ?? "Клиент"}
              {dispute.specialist ? ` → ${dispute.specialist}` : ""} · решен на{" "}
              {dispute.resolvedAt.slice(0, 10)}
              {dispute.resolvedByName ? ` от ${dispute.resolvedByName}` : ""}
            </span>
            <p className="m-0 mt-1.5 text-foreground">Сигнал: {dispute.note}</p>
            {dispute.resolutionNote && (
              <p className="m-0 mt-1.5 text-foreground">
                Решение: {dispute.resolutionNote}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
