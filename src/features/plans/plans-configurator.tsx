"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { DatePicker } from "@/features/plans/date-picker";
import { useDemo } from "@/features/requests/demo-provider";
import { calculateQuote } from "@/features/requests/pricing";
import type { Plan } from "@/features/requests/types";
import { localDate, money } from "@/lib/format";
import styles from "./plans.module.css";

const planOptions: Record<
  Plan,
  {
    label: string;
    description: string;
    quantityLabel: string;
    unit: string;
    defaultQuantity: number;
    service: string;
    features: string[];
  }
> = {
  home: {
    label: "За дома",
    description: "Редовно почистване на апартамент или къща.",
    quantityLabel: "Площ на дома",
    unit: "м²",
    defaultQuantity: 80,
    service: "Абонамент За дома",
    features: [
      "Подове и достъпни повърхности",
      "Кухня и санитарни помещения",
      "Отчет след всяко посещение",
    ],
  },
  entry: {
    label: "За входа",
    description: "Постоянна грижа за общите части.",
    quantityLabel: "Брой етажи",
    unit: "етажа",
    defaultQuantity: 6,
    service: "Абонамент За входа",
    features: [
      "Стълби и етажни площадки",
      "Входна врата и парапети",
      "Отчет към представител на входа",
    ],
  },
};

const quickVisits = [1, 2, 4] as const;

export function PlansConfigurator() {
  const router = useRouter();
  const notify = useToast();
  const { tariffs, addRequest } = useDemo();
  const [plan, setPlan] = useState<Plan>("home");
  const [visits, setVisits] = useState(2);
  const [quantity, setQuantity] = useState(80);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const option = planOptions[plan];
  const validQuantity =
    Number.isInteger(quantity) && quantity >= 1 && quantity <= 1000;
  const price = validQuantity
    ? calculateQuote(tariffs, 4, 0, plan, quantity, visits)
    : null;
  const today = localDate();
  const discount = visits >= 4;

  function choosePlan(nextPlan: Plan) {
    setPlan(nextPlan);
    setQuantity(planOptions[nextPlan].defaultQuantity);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const address = String(data.get("address") ?? "").trim();
    const date = String(data.get("date") ?? "");
    const time = String(data.get("time") ?? "");
    const notes = String(data.get("notes") ?? "").trim();
    const nextErrors: Record<string, string> = {};

    if (!address) nextErrors.address = "Въведете адрес на имота.";
    if (!date) nextErrors.date = "Изберете предпочитана начална дата.";
    else if (date < today)
      nextErrors.date = "Датата не може да бъде в миналото.";
    if (!time) nextErrors.time = "Изберете часови диапазон.";
    if (!validQuantity) {
      nextErrors.quantity = `Въведете ${plan === "home" ? "площ" : "брой етажи"} между 1 и 1000.`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || price === null) return;

    addRequest({
      id: crypto.randomUUID(),
      category: 4,
      service: option.service,
      address,
      description:
        notes || `${visits} посещения месечно за ${quantity} ${option.unit}.`,
      date,
      time,
      price,
      status: 0,
      plan,
      visitsPerMonth: visits,
      propertySize: quantity,
    });
    notify("Абонаментната заявка е създадена успешно.");
    router.push("/requests");
  }

  return (
    <div className={styles.configurator}>
      <section className={styles.controls} aria-labelledby="configure-title">
        <div>
          <span className={styles.step}>01</span>
          <h2 id="configure-title">За кое пространство?</h2>
          <div className={styles.segmented} aria-label="Изберете план">
            {(Object.keys(planOptions) as Plan[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={plan === item}
                onClick={() => choosePlan(item)}
              >
                {planOptions[item].label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>{option.description}</p>
        </div>

        <div>
          <span className={styles.step}>02</span>
          <h2>Колко често?</h2>
          <div
            className={styles.quickVisits}
            aria-label="Бърз избор на посещения"
          >
            {quickVisits.map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={visits === count}
                onClick={() => setVisits(count)}
              >
                <strong>{count}</strong>
                <span>{count === 1 ? "посещение" : "посещения"}</span>
                {count === 2 && <small>Препоръчано</small>}
              </button>
            ))}
          </div>
          <div className={styles.stepper}>
            <span>Посещения на месец</span>
            <div>
              <button
                type="button"
                aria-label="Намали посещенията"
                disabled={visits === 1}
                onClick={() => setVisits((current) => Math.max(1, current - 1))}
              >
                −
              </button>
              <output aria-live="polite">{visits}</output>
              <button
                type="button"
                aria-label="Увеличи посещенията"
                disabled={visits === 8}
                onClick={() => setVisits((current) => Math.min(8, current + 1))}
              >
                +
              </button>
            </div>
          </div>
          {discount && (
            <p className={styles.discount}>10% отстъпка за редовна грижа</p>
          )}
        </div>

        <div>
          <span className={styles.step}>03</span>
          <h2>Размер на имота</h2>
          <label className={styles.quantityLabel}>
            {option.quantityLabel}
            <span>
              <input
                type="number"
                min="1"
                max="1000"
                step="1"
                value={quantity}
                aria-describedby={
                  errors.quantity ? "quantity-error" : undefined
                }
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
              <strong>{option.unit}</strong>
            </span>
          </label>
          {errors.quantity && (
            <p id="quantity-error" className={styles.error}>
              {errors.quantity}
            </p>
          )}
        </div>

        <div className={styles.included}>
          <h2>Включено във всяко посещение</h2>
          <ul>
            {option.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
            {visits >= 4 && <li>Приоритетно пренасрочване</li>}
            {visits >= 8 && <li>Един и същ екип по постоянен график</li>}
          </ul>
        </div>
      </section>

      <aside className={styles.summary} aria-labelledby="summary-title">
        <div className={styles.summaryTop}>
          <span>ВАШИЯТ ПЛАН</span>
          {discount && <strong>−10%</strong>}
        </div>
        <h2 id="summary-title">{option.label}</h2>
        <p>
          {visits} {visits === 1 ? "посещение" : "посещения"} месечно ·{" "}
          {quantity || "—"} {option.unit}
        </p>
        <div className={styles.price} aria-live="polite">
          <strong>{price === null ? "—" : money(price)}</strong>
          <span>/ месец</span>
        </div>
        <p className={styles.breakdown}>
          {money(tariffs[plan])} × {quantity || "—"} {option.unit} × {visits}{" "}
          посещения
          {discount && " × 0.90"}
        </p>

        <form className={styles.bookingForm} onSubmit={submit} noValidate>
          <div className={styles.bookingHeading}>
            <span>СТЪПКА 04</span>
            <h3>Заявете старт</h3>
          </div>
          <div className={styles.bookingFields}>
            <Field
              label="Адрес на имота"
              error={errors.address}
              id="address-error"
            >
              <input
                name="address"
                autoComplete="street-address"
                aria-invalid={Boolean(errors.address)}
                aria-describedby={errors.address ? "address-error" : undefined}
                placeholder="Град, улица, номер, вход"
              />
            </Field>
            <Field
              label="Предпочитана начална дата"
              error={errors.date}
              id="date-error"
            >
              <DatePicker
                min={today}
                invalid={Boolean(errors.date)}
                describedBy={errors.date ? "date-error" : undefined}
              />
            </Field>
            <Field label="Часови диапазон" error={errors.time} id="time-error">
              <select
                name="time"
                defaultValue=""
                aria-invalid={Boolean(errors.time)}
                aria-describedby={errors.time ? "time-error" : undefined}
              >
                <option value="" disabled>
                  Изберете диапазон
                </option>
                <option>09:00–12:00</option>
                <option>12:00–15:00</option>
                <option>15:00–18:00</option>
              </select>
            </Field>
            <label className={styles.bookingField}>
              Бележки <span className={styles.optional}>(по желание)</span>
              <textarea
                name="notes"
                rows={3}
                placeholder="Достъп, предпочитания или друга важна информация"
              />
            </label>
          </div>
          <button className={styles.submit} type="submit">
            Изпрати заявка
          </button>
          <small className={styles.prototype}>
            Демо заявка без плащане. Графикът подлежи на потвърждение.
          </small>
        </form>
      </aside>
    </div>
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
  children: React.ReactNode;
}) {
  return (
    <label className={styles.bookingField}>
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
