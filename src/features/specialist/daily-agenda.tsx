"use client";

import { useRef, useState, type FormEvent } from "react";
import { ServiceIcon } from "@/features/services/service-icon";
import { requestStages } from "@/features/services/catalog";
import { isActiveStage } from "@/features/requests/request-rules";
import { useToast } from "@/components/ui/toast-provider";
import { useDemo } from "@/features/requests/demo-provider";
import {
  completeWorkAction,
  startWorkAction,
} from "@/features/requests/server/actions";
import { money } from "@/lib/format";
import { RequestStatus, Role } from "@/features/requests/types";
import type { ServiceRequest } from "@/features/requests/types";
import styles from "./specialist-dashboard.module.css";

export function DailyAgenda({
  initialAgenda,
}: {
  initialAgenda?: ServiceRequest[] | null;
}) {
  const { requests: demoRequests, updateRequest } = useDemo();
  const notify = useToast();
  const dialog = useRef<HTMLDialogElement>(null);
  const [reportTarget, setReportTarget] = useState<ServiceRequest | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const items =
    initialAgenda ??
    demoRequests.filter(
      (request) => !request.cancelled && isActiveStage(request.status),
    );

  async function startWork(request: ServiceRequest) {
    setBusyId(request.id);
    updateRequest(request.id, { type: "advance" }, Role.Specialist);
    try {
      const result = await startWorkAction(request.id);
      if (!result.success) {
        notify(result.error ?? "Грешка при стартиране на задачата.");
        return;
      }
    } catch {
      // Demo mode or network fallback
    }
    notify("Задачата е започната.");
    setBusyId(null);
  }

  function openReportDialog(request: ServiceRequest) {
    setReportTarget(request);
    dialog.current?.showModal();
  }

  function closeReportDialog() {
    dialog.current?.close();
    setReportTarget(null);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportTarget) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const report = String(data.get("report") ?? "").trim();
    if (!report) {
      notify("Отчетът е задължителен, за да завършите задачата.");
      return;
    }

    setBusyId(reportTarget.id);
    updateRequest(
      reportTarget.id,
      { type: "advance", report },
      Role.Specialist,
    );
    try {
      const result = await completeWorkAction(reportTarget.id, report);
      if (!result.success) {
        notify(result.error ?? "Грешка при завършване на задачата.");
        setBusyId(null);
        return;
      }
    } catch {
      // Demo mode or network fallback
    }
    notify("Отчетът е изпратен. Очаква потвърждение от клиента.");
    setBusyId(null);
    closeReportDialog();
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
          <button
            className="primary full"
            type="submit"
            disabled={busyId === reportTarget?.id}
          >
            Изпрати отчет
          </button>
        </form>
      </dialog>
    </section>
  );
}
