"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { useDemo } from "@/features/requests/demo-provider";
import { calculateQuote, quoteScope } from "@/features/requests/pricing";
import { createServiceRequestAction } from "@/features/requests/server/actions";
import { generateDemoId } from "@/features/requests/demo-data";
import type { BookingSelection, CategoryId } from "@/features/requests/types";
import { categories, isCategoryId } from "@/features/services/catalog";
import { localDate, money } from "@/lib/format";
import { PhotoPicker } from "./photo-picker";

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
    if (!form.reportValidity() || price === null || isSubmitting) return;
    const data = new FormData(form);
    const description = String(data.get("description") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    if (description.length < 5 || !address) {
      notify("Въведете адрес и описание с поне 5 символа.");
      return;
    }

    const serviceName = plan
      ? `Абонамент ${plan === "home" ? "За дома" : "За входа"}`
      : categories[category].services[serviceIndex];
    const dateStr = String(data.get("date"));
    const timeStr = String(data.get("time"));

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
      aria-labelledby="booking-title"
      onCancel={(event) => {
        event.preventDefault();
        closeBooking();
      }}
    >
      <div className="dialoghead">
        <div>
          <span className="eyebrow">DOMORA / НОВА ЗАЯВКА</span>
          <h2 id="booking-title">
            {plan
              ? `Абонамент ${plan === "home" ? "за дома" : "за входа"}`
              : "Разкажете ни от какво се нуждаете"}
          </h2>
        </div>
        <button className="icon" aria-label="Затвори" onClick={closeBooking}>
          ×
        </button>
      </div>
      <form onSubmit={submit}>
        <div className="formgrid">
          <label>
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
          <label>
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
        <label>
          Описание на проблема
          <textarea
            name="description"
            required
            minLength={5}
            placeholder="Какво трябва да направим?"
            rows={3}
          />
        </label>
        <PhotoPicker />
        <label>
          Адрес
          <input
            name="address"
            required
            placeholder="Град, улица, номер, вход"
          />
        </label>
        <div className="formgrid">
          <label>
            Предпочитана дата
            <input name="date" type="date" required min={today} />
          </label>
          <label>
            Предпочитан час
            <select name="time">
              <option>09:00–12:00</option>
              <option>12:00–15:00</option>
              <option>15:00–18:00</option>
            </select>
          </label>
        </div>
        {plan && (
          <label>
            {plan === "entry" ? "Брой етажи" : "Площ на дома (м²)"}
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              required
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
        )}
        <div className="quote" aria-live="polite">
          <div>
            <small>Демонстрационна цена</small>
            <strong>
              {price === null ? "—" : money(price)}
              {plan ? " / месец" : ""}
            </strong>
          </div>
          <span>{quoteScope(category, serviceIndex, plan)}</span>
        </div>
        <p className="muted">
          Часът подлежи на потвърждение. Материали и допълнителна работа се
          одобряват отделно.
        </p>
        <button
          className="primary full"
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
