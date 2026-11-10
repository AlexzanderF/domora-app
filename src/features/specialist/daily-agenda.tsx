"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { PhotoPicker } from "@/features/bookings/photo-picker";
import { uploadReportPhotos } from "@/features/bookings/upload-photos";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceIcon } from "@/features/services/service-icon";
import { requestStages } from "@/features/services/catalog";
import { useToast } from "@/components/ui/toast-provider";
import {
  completeWorkAction,
  startWorkAction,
} from "@/features/requests/server/actions";
import { mapsSearchUrl } from "./maps-link";
import { hasUnsavedReport } from "./report-draft";
import { DiscardReportSheet } from "./discard-report-sheet";
import { money } from "@/lib/format";
import { RequestStatus } from "@/domain/requests/types";
import type { ServiceRequest } from "@/domain/requests/types";
import {
  RequestActions,
  RequestRow,
  SpecialistSection,
  actionButton,
  rowText,
} from "./section-parts";

export function DailyAgenda({
  initialAgenda,
}: {
  initialAgenda: ServiceRequest[];
}) {
  const router = useRouter();
  const notify = useToast();
  const [reportTarget, setReportTarget] = useState<ServiceRequest | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reportText, setReportText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosBusy, setPhotosBusy] = useState(false);
  // Remounts the picker so a previous report's previews do not linger.
  const [pickerKey, setPickerKey] = useState(0);
  const [discardAsking, setDiscardAsking] = useState(false);
  const discardAnswer = useRef<((discard: boolean) => void) | null>(null);

  const items = initialAgenda;

  async function startWork(request: ServiceRequest) {
    setBusyId(request.id);
    try {
      const result = await startWorkAction(request.id);
      if (!result.success) {
        notify(result.error ?? "Грешка при стартиране на задачата.");
        return;
      }
      notify("Задачата е започната.");
      router.refresh();
    } catch {
      notify("Грешка при стартиране на задачата. Опитайте отново.");
    } finally {
      setBusyId(null);
    }
  }

  function openReportDialog(request: ServiceRequest) {
    setReportTarget(request);
  }

  function askDiscard() {
    setDiscardAsking(true);
    return new Promise<boolean>((resolve) => {
      discardAnswer.current = resolve;
    });
  }

  function answerDiscard(discard: boolean) {
    setDiscardAsking(false);
    discardAnswer.current?.(discard);
    discardAnswer.current = null;
  }

  function closeReportDialog() {
    setReportTarget(null);
    setReportText("");
    setPhotos([]);
    setPickerKey((key) => key + 1);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportTarget || photosBusy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const report = String(data.get("report") ?? "").trim();
    if (!report) {
      notify("Отчетът е задължителен, за да завършите задачата.");
      return;
    }

    setBusyId(reportTarget.id);
    try {
      const result = await completeWorkAction(reportTarget.id, report);
      if (!result.success) {
        notify(result.error ?? "Грешка при завършване на задачата.");
        return;
      }
      // The report is saved first; photos attach to it afterwards.
      const uploaded = photos.length
        ? await uploadReportPhotos(reportTarget.id, photos)
        : null;
      notify(
        uploaded && !uploaded.ok
          ? `Отчетът е изпратен, но снимките не бяха добавени. ${uploaded.error}`
          : "Отчетът е изпратен. Очаква потвърждение от клиента.",
      );
      closeReportDialog();
      router.refresh();
    } catch {
      notify("Грешка при завършване на задачата. Опитайте отново.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SpecialistSection title="Дневен график" badge="Активни задачи">
      {items.length === 0 ? (
        <EmptyState>Няма активни задачи за днес.</EmptyState>
      ) : (
        items.map((request) => (
          <RequestRow
            key={request.id}
            label={request.service}
            icon={<ServiceIcon category={request.category} />}
            amount={money(request.price)}
            disputed={request.issue}
          >
            <h3>{request.service}</h3>
            <p className={rowText}>
              {request.date} · {request.time}
            </p>
            <p className={rowText}>
              <a
                href={mapsSearchUrl(request.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-primary underline"
              >
                {request.address}
              </a>
            </p>
            <StatusBadge>{requestStages[request.status]}</StatusBadge>
            {request.dispatchedByAdmin && (
              <StatusBadge tone="pending">
                Разпределена от администратор
              </StatusBadge>
            )}
            <p className={rowText}>
              {request.clientName ?? "Клиент"}
              {request.clientPhone && ` · ${request.clientPhone}`}
            </p>
            {request.clientPhone && (
              <Button
                asChild
                variant="secondary"
                size="compact"
                className="mb-2.5 w-full sm:w-auto"
              >
                <a href={`tel:${request.clientPhone}`}>Обади се</a>
              </Button>
            )}
            {request.issue && (
              <p
                className={`${rowText} border-l-[3px] border-tone-d9776b bg-tone-fbe9e7 px-3.5 py-2.5`}
              >
                Клиентът е подал сигнал за проблем с извършената работа.
                Прегледайте и коригирайте при нужда.
                {request.issueNote && <> Бележка: „{request.issueNote}“</>}
              </p>
            )}
            <RequestActions>
              {request.status === RequestStatus.Accepted && (
                <Button
                  size="compact"
                  className={actionButton}
                  disabled={busyId === request.id}
                  onClick={() => void startWork(request)}
                >
                  {busyId === request.id ? "Стартиране…" : "Започни работа"}
                </Button>
              )}
              {request.status === RequestStatus.InProgress && (
                <Button
                  size="compact"
                  className={actionButton}
                  disabled={busyId === request.id}
                  onClick={() => openReportDialog(request)}
                >
                  Завърши с доклад
                </Button>
              )}
            </RequestActions>
          </RequestRow>
        ))
      )}

      <Dialog
        open={reportTarget !== null}
        blockOutsideDismiss
        confirmClose={() =>
          !hasUnsavedReport(reportText, photos.length) || askDiscard()
        }
        onOpenChange={(open) => {
          if (!open) closeReportDialog();
        }}
      >
        <DialogContent className="min-h-[85dvh] sm:min-h-0">
          <DialogHeader>
            <span className="text-xs font-bold tracking-[1.5px] text-muted-foreground">
              DOMORA / ОТЧЕТ ЗА ИЗВЪРШЕНА РАБОТА
            </span>
            <DialogTitle>{reportTarget?.service}</DialogTitle>
            <DialogDescription className="sr-only">
              Опишете извършената работа и добавете снимки по желание.
            </DialogDescription>
          </DialogHeader>
          <form className="contents" onSubmit={submitReport}>
            <DialogBody>
              <Label htmlFor="report" className="mb-0">
                Описание на извършената работа
              </Label>
              <Textarea
                id="report"
                name="report"
                required
                minLength={5}
                placeholder="Какво беше извършено?"
                rows={4}
                className="mb-3.5"
                value={reportText}
                onChange={(event) => setReportText(event.target.value)}
              />
              <PhotoPicker
                key={pickerKey}
                onChange={setPhotos}
                onBusyChange={setPhotosBusy}
              />
            </DialogBody>
            <DialogFooter>
              <Button
                className="w-full"
                type="submit"
                disabled={busyId === reportTarget?.id || photosBusy}
              >
                Изпрати отчет
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DiscardReportSheet
        open={discardAsking}
        onKeep={() => answerDiscard(false)}
        onDiscard={() => answerDiscard(true)}
      />
    </SpecialistSection>
  );
}
