"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { PhotoPicker } from "@/features/bookings/photo-picker";
import { uploadReportPhotos } from "@/features/bookings/upload-photos";
import { ServiceIcon } from "@/features/services/service-icon";
import { requestStages } from "@/features/services/catalog";
import { useToast } from "@/components/ui/toast-provider";
import {
  completeWorkAction,
  startWorkAction,
} from "@/features/requests/server/actions";
import { money } from "@/lib/format";
import { RequestStatus } from "@/features/requests/types";
import type { ServiceRequest } from "@/features/requests/types";
import styles from "./specialist-dashboard.module.css";

export function DailyAgenda({
  initialAgenda,
}: {
  initialAgenda: ServiceRequest[];
}) {
  const router = useRouter();
  const notify = useToast();
  const dialog = useRef<HTMLDialogElement>(null);
  const [reportTarget, setReportTarget] = useState<ServiceRequest | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosBusy, setPhotosBusy] = useState(false);
  // Remounts the picker so a previous report's previews do not linger.
  const [pickerKey, setPickerKey] = useState(0);

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
    dialog.current?.showModal();
  }

  function closeReportDialog() {
    dialog.current?.close();
    setReportTarget(null);
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
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Дневен график</h2>
          <span className={styles.sectionBadge}>Активни задачи</span>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="empty">Няма активни задачи за днес.</div>
      ) : (
        items.map((request) => (
          <article
            className={`request ${request.issue ? styles.disputed : ""}`}
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
              <span className="badge">{requestStages[request.status]}</span>
              {request.dispatchedByAdmin && (
                <span className={styles.recommendedBadge}>
                  Разпределена от администратор
                </span>
              )}
              <p>
                {request.clientName ?? "Клиент"}
                {request.clientPhone && (
                  <>
                    {" · "}
                    <a href={`tel:${request.clientPhone}`}>
                      {request.clientPhone}
                    </a>
                  </>
                )}
              </p>
              {request.issue && (
                <p className={styles.disputeNotice}>
                  Клиентът е подал сигнал за проблем с извършената работа.
                  Прегледайте и коригирайте при нужда.
                  {request.issueNote && <> Бележка: „{request.issueNote}“</>}
                </p>
              )}
              <div className="actions">
                {request.status === RequestStatus.Accepted && (
                  <button
                    className="primary"
                    disabled={busyId === request.id}
                    onClick={() => void startWork(request)}
                  >
                    {busyId === request.id ? "Стартиране…" : "Започни работа"}
                  </button>
                )}
                {request.status === RequestStatus.InProgress && (
                  <button
                    className="primary"
                    disabled={busyId === request.id}
                    onClick={() => openReportDialog(request)}
                  >
                    Завърши с доклад
                  </button>
                )}
              </div>
            </div>
            <span className="amount">{money(request.price)}</span>
          </article>
        ))
      )}

      <dialog
        ref={dialog}
        aria-labelledby="report-title"
        onCancel={(event) => {
          event.preventDefault();
          closeReportDialog();
        }}
      >
        <div className="dialoghead">
          <div>
            <span className="eyebrow">DOMORA / ОТЧЕТ ЗА ИЗВЪРШЕНА РАБОТА</span>
            <h2 id="report-title">{reportTarget?.service}</h2>
          </div>
          <button
            className="icon"
            aria-label="Затвори"
            onClick={closeReportDialog}
          >
            ×
          </button>
        </div>
        <form onSubmit={submitReport}>
          <label>
            Описание на извършената работа
            <textarea
              name="report"
              required
              minLength={5}
              placeholder="Какво беше извършено?"
              rows={4}
            />
          </label>
          <PhotoPicker
            key={pickerKey}
            onChange={setPhotos}
            onBusyChange={setPhotosBusy}
          />
          <button
            className="primary full"
            type="submit"
            disabled={busyId === reportTarget?.id || photosBusy}
          >
            Изпрати отчет
          </button>
        </form>
      </dialog>
    </section>
  );
}
