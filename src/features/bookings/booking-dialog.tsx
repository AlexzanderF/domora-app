"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { DatePicker } from "@/features/plans/date-picker";
import { TimePicker } from "@/features/plans/time-picker";
import { useDemo } from "@/features/requests/demo-provider";
import { calculateQuote, quoteScope } from "@/features/requests/pricing";
import { createServiceRequestAction } from "@/features/requests/server/actions";
import { generateDemoId } from "@/features/requests/demo-data";
import type { BookingSelection, CategoryId } from "@/features/requests/types";
import { categories, isCategoryId } from "@/features/services/catalog";
import { localDate, money } from "@/lib/format";
import { PhotoPicker } from "./photo-picker";
import styles from "./booking-dialog.module.css";

export function BookingDialog() {
  const { booking } = useDemo();
  return booking ? (
    <BookingForm
      key={`${booking.category}-${booking.plan ?? "service"}`}
      selection={booking}
    />
  ) : null;
}

function BookingForm({ selection }: { selection: BookingSelection }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { closeBooking, tariffs, addRequest } = useDemo();
  const notify = useToast();
  const [category, setCategory] = useState<CategoryId>(selection.category);
  const [serviceIndex, setServiceIndex] = useState(0);
  const [quantity, setQuantity] = useState(
    selection.plan === "entry" ? "6" : "80",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const plan = selection.plan;
  const validQuantity =
    Number.isInteger(Number(quantity)) &&
    Number(quantity) >= 1 &&
    Number(quantity) <= 1000;
  const price =
    !plan || validQuantity
      ? calculateQuote(tariffs, category, serviceIndex, plan, Number(quantity))
      : null;
  // This component only mounts after a client interaction, so the local date is appropriate.
  const today = localDate();

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (isSubmitting) return;
    const data = new FormData(form);
    const description = String(data.get("description") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    const dateStr = String(data.get("date"));
    const timeStr = String(data.get("time"));
    const nextErrors: Record<string, string> = {};

    if (!description) nextErrors.description = "Опишете накратко проблема.";
    else if (description.length < 5)
      nextErrors.description = "Описанието трябва да е поне 5 символа.";
    if (!address) nextErrors.address = "Въведете адрес на имота.";
    if (!dateStr) nextErrors.date = "Изберете предпочитана дата.";
    else if (dateStr < today)
      nextErrors.date = "Датата не може да бъде в миналото.";
    if (!timeStr) nextErrors.time = "Изберете часови диапазон.";
    if (!validQuantity) {
      nextErrors.quantity = `Въведете ${plan === "entry" ? "брой етажи" : "площ"} между 1 и 1000.`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (price === null) return;

    const serviceName = plan
      ? `Абонамент ${plan === "home" ? "За дома" : "За входа"}`
      : categories[category].services[serviceIndex];

    setIsSubmitting(true);
    try {
      const actionResult = await createServiceRequestAction({
        category,
        service: serviceName,
        address,
        description,
        date: dateStr,
        time: timeStr,
        price,
        plan,
      });

      if (actionResult.mode === "demo") {
        addRequest({
          id: generateDemoId(),
          category,
          service: serviceName,
          address,
          description,
          date: dateStr,
          time: timeStr,
          price,
          status: 0,
          plan,
        });
        closeBooking();
        router.push("/client/requests");
        notify(
          "Демо заявката е създадена. Не е изпратена до реален специалист.",
        );
        return;
      }

      if (actionResult.success) {
        if (actionResult.request) {
          addRequest(actionResult.request);
        }
        closeBooking();
        router.push("/client/requests");
        notify("Заявката е създадена успешно.");
        return;
      }

      notify(
        actionResult.error ?? "Възникна грешка при създаване на заявката.",
      );
    } catch {
      // Fallback to demo in case of network issue
      addRequest({
        id: generateDemoId(),
        category,
        service: serviceName,
        address,
        description,
        date: dateStr,
        time: timeStr,
        price,
        status: 0,
        plan,
      });
      closeBooking();
      router.push("/client/requests");
      notify("Демо заявката е създадена. Не е изпратена до реален специалист.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="booking-title"
      onCancel={(event) => {
        event.preventDefault();
        closeBooking();
      }}
    >
      <div className={styles.dialogHead}>
        <div>
          <span className={styles.eyebrow}>DOMORA / НОВА ЗАЯВКА</span>
          <h2 id="booking-title">
            {plan
              ? `Абонамент ${plan === "home" ? "за дома" : "за входа"}`
              : "Разкажете ни от какво се нуждаете"}
          </h2>
        </div>
        <button
          className={styles.closeButton}
          type="button"
          aria-label="Затвори"
          onClick={closeBooking}
        >
          ×
        </button>
      </div>
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            Категория
            <select
              disabled={Boolean(plan)}
              value={category}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (isCategoryId(value)) {
                  setCategory(value);
                  setServiceIndex(0);
                }
              }}
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Услуга
            <select
              disabled={Boolean(plan)}
              value={serviceIndex}
              onChange={(event) => setServiceIndex(Number(event.target.value))}
            >
              {plan ? (
                <option value={0}>
                  {plan === "home"
                    ? "Абонаментно почистване на дома"
                    : "Абонаментно почистване на общите части"}
                </option>
              ) : (
                categories[category].services.map((service, index) => (
                  <option key={service} value={index}>
                    {service}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
        <Field
          label="Описание на проблема"
          error={errors.description}
          id="description-error"
        >
          <textarea
            name="description"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "description-error" : undefined
            }
            placeholder="Какво трябва да направим?"
            rows={2}
          />
        </Field>
        <div className={styles.photoSlot}>
          <PhotoPicker />
        </div>
        <Field label="Адрес" error={errors.address} id="address-error">
          <input
            name="address"
            autoComplete="street-address"
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? "address-error" : undefined}
            placeholder="Град, улица, номер, вход"
          />
        </Field>
        <div className={styles.fieldGrid}>
          <FieldGroup
            label="Предпочитана дата"
            error={errors.date}
            id="date-error"
          >
            <DatePicker
              min={today}
              invalid={Boolean(errors.date)}
              describedBy={errors.date ? "date-error" : undefined}
            />
          </FieldGroup>
          <FieldGroup
            label="Часови диапазон"
            error={errors.time}
            id="time-error"
          >
            <TimePicker
              invalid={Boolean(errors.time)}
              describedBy={errors.time ? "time-error" : undefined}
            />
          </FieldGroup>
        </div>
        {plan && (
          <Field
            label={plan === "entry" ? "Брой етажи" : "Площ на дома (м²)"}
            error={errors.quantity}
            id="quantity-error"
          >
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              aria-invalid={Boolean(errors.quantity)}
              aria-describedby={errors.quantity ? "quantity-error" : undefined}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>
        )}
        <div className={styles.quote} aria-live="polite">
          <div>
            <small>Демонстрационна цена</small>
            <strong>
              {price === null ? "—" : money(price)}
              {plan ? " / месец" : ""}
            </strong>
          </div>
          <span>{quoteScope(category, serviceIndex, plan)}</span>
        </div>
        <p className={styles.note}>
          Часът подлежи на потвърждение. Материали и допълнителна работа се
          одобряват отделно.
        </p>
        <button
          className={styles.submit}
          type="submit"
          disabled={isSubmitting}
          aria-label="Изпрати демо заявка"
        >
          {isSubmitting ? "Изпращане..." : "Изпрати демо заявка →"}
        </button>
      </form>
    </dialog>
  );
}

function Field({
  label,
  error,
  id,
  children,
}: {
  label: string;
  error?: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      {label}
      {children}
      {error && (
        <span id={id} className={styles.error}>
          {error}
        </span>
      )}
    </label>
  );
}

function FieldGroup({
  label,
  error,
  id,
  children,
}: {
  label: string;
  error?: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <span>{label}</span>
      {children}
      {error && (
        <span id={id} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
