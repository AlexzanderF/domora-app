"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { DateField, TimeRangeSelect } from "@/components/ui/schedule-fields";
import { calculateQuote } from "@/domain/pricing";
import { Plan } from "@/domain/requests/types";
import type { Tariffs } from "@/domain/requests/types";
import { startSubscriptionAction } from "@/features/subscriptions/server/actions";
import { SubscriptionPlan } from "@/domain/subscriptions/types";
import { localDate, money } from "@/lib/format";
import { isPastDate } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { HomePlanPreview } from "./home-plan-preview";

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
    description: "Едно посещение от майстор всеки месец за вашия дом.",
    quantityLabel: "Площ на дома",
    unit: "м²",
    defaultQuantity: 80,
    service: "Абонамент За дома",
    features: [
      "ВиК, електро и климатици",
      "Ключарски услуги и дребни ремонти",
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

const section = "border-b border-[#dce5df] pb-10";
const step = "text-xs font-[850] tracking-[0.12em] text-[#517067]";
const sectionTitle = "mt-[0.35rem] mb-[1.2rem] text-[1.35rem] text-[#17372f]";
const fieldLabel =
  "m-0 grid content-start gap-[0.38rem] text-[0.82rem] leading-[1.55] font-bold text-[#40564f]";
const fieldControl =
  "mt-0 min-h-11 rounded-md border-[#ccd9d1] text-base leading-[1.55] aria-invalid:border-[#b14545]";
const checkItem =
  "before:mr-[0.65rem] before:font-[850] before:text-[#287057] before:content-['✓']";
const stepperButton =
  "h-11 rounded-none p-0 text-[1.25rem] font-[650] text-[#175246] hover:bg-white disabled:pointer-events-auto disabled:cursor-not-allowed disabled:text-[#a9b6b1] disabled:opacity-100";
const errorText =
  "mt-[0.3rem] block text-[0.76rem] font-[650] text-tone-a33b3b";

export function PlansConfigurator({ tariffs }: { tariffs: Tariffs }) {
  const router = useRouter();
  const notify = useToast();
  const [plan, setPlan] = useState<Plan>(Plan.Home);
  const [visits, setVisits] = useState(2);
  const [quantity, setQuantity] = useState(80);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The sheet is phone/tablet only: close it (releasing overlay and scroll lock)
  // if the viewport reaches lg while it is open.
  useEffect(() => {
    if (!sheetOpen) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const close = () => {
      if (query.matches) setSheetOpen(false);
    };
    close();
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, [sheetOpen]);
  const option = planOptions[plan];
  const validQuantity =
    Number.isInteger(quantity) && quantity >= 1 && quantity <= 1000;
  const price = validQuantity
    ? calculateQuote(tariffs, 4, 0, plan, quantity, visits)
    : null;
  const today = localDate();
  const discount = visits >= tariffs.volumeDiscountMinVisits;
  const discountPercent = tariffs.volumeDiscountPercent;

  function choosePlan(nextPlan: Plan) {
    setPlan(nextPlan);
    setQuantity(planOptions[nextPlan].defaultQuantity);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
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
    else if (isPastDate(date, today))
      nextErrors.date = "Датата не може да бъде в миналото.";
    if (!time) nextErrors.time = "Изберете часови диапазон.";
    if (!validQuantity) {
      nextErrors.quantity = `Въведете ${plan === Plan.Home ? "площ" : "брой етажи"} между 1 и 1000.`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || price === null || saving) return;

    const description =
      notes || `${visits} посещения месечно за ${quantity} ${option.unit}.`;

    setSaving(true);
    try {
      const result = await startSubscriptionAction({
        planType:
          plan === Plan.Home ? SubscriptionPlan.Home : SubscriptionPlan.Entry,
        propertyAddress: address,
        propertyArea: quantity,
        visitsPerMonth: visits,
        firstVisit: {
          service: option.service,
          description,
          date,
          time,
          price: Math.max(1, Math.round(price / visits)),
        },
      });
      if (!result.success) {
        notify(result.error ?? "Абонаментът не можа да бъде създаден.");
        return;
      }
      notify("Абонаментът е създаден успешно.");
      router.push("/client/plan");
    } finally {
      setSaving(false);
    }
  }

  function renderForm(inSheet: boolean) {
    return (
      <form
        className={
          inSheet
            ? "contents"
            : "hidden gap-4 border-t border-[#dbe5df] pt-5 lg:grid"
        }
        onSubmit={submit}
        noValidate
      >
        {inSheet ? (
          <DialogHeader>
            <span className="text-xs font-[800] text-[#668078]">СТЪПКА 04</span>
            <DialogTitle className="m-0 text-[1.35rem] leading-[1.18] text-[#17372f]">
              Заявете старт
            </DialogTitle>
            <DialogDescription className="sr-only">
              Адрес, начална дата и часови диапазон за абонамента.
            </DialogDescription>
          </DialogHeader>
        ) : (
          <div className="grid gap-[0.15rem]">
            <span className="text-xs font-[800] text-[#668078]">СТЪПКА 04</span>
            <h3 className="text-[1.15rem] text-[#17372f]">Заявете старт</h3>
          </div>
        )}
        <FormBody inSheet={inSheet} className="grid content-start gap-[0.9rem]">
          <Field
            label="Адрес на имота"
            error={errors.address}
            id="address-error"
          >
            <Input
              name="address"
              autoComplete="street-address"
              className={fieldControl}
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
            <DateField
              min={today}
              className={fieldControl}
              invalid={Boolean(errors.date)}
              describedBy={errors.date ? "date-error" : undefined}
            />
          </Field>
          <Field label="Часови диапазон" error={errors.time} id="time-error">
            <TimeRangeSelect
              invalid={Boolean(errors.time)}
              describedBy={errors.time ? "time-error" : undefined}
            />
          </Field>
          <Label className={fieldLabel}>
            Бележки{" "}
            <span className="font-normal text-[#74847f]">(по желание)</span>
            <Textarea
              name="notes"
              rows={3}
              className={cn(fieldControl, "min-h-[86px]")}
              placeholder="Достъп, предпочитания или друга важна информация"
            />
          </Label>
        </FormBody>
        <FormFoot inSheet={inSheet} className="mt-[0.35rem] grid gap-4">
          <Button
            className="min-h-12 rounded-[7px] bg-[#175246] px-0 py-0 font-extrabold hover:bg-[#103c33]"
            type="submit"
            disabled={saving}
          >
            {saving ? "Обработва се..." : "Заявете абонамент"}
          </Button>
          <small className="text-center text-xs text-[#74847f]">
            Демо заявка без плащане. Графикът подлежи на потвърждение.
          </small>
        </FormFoot>
      </form>
    );
  }

  if (plan === Plan.Home) {
    return <HomePlanPreview onChooseEntry={() => choosePlan(Plan.Entry)} />;
  }

  return (
    <div className="mt-10 md:mt-14 lg:mt-18 grid pb-24 lg:pb-0 grid-cols-1 items-start gap-8 md:gap-12 lg:gap-20 lg:grid-cols-[minmax(0,1fr)_minmax(330px,420px)]">
      <section className="grid gap-10" aria-labelledby="configure-title">
        <div className={section}>
          <span className={step}>01</span>
          <h2 id="configure-title" className={sectionTitle}>
            За кое пространство?
          </h2>
          <div
            className="grid grid-cols-2 gap-2 rounded-lg border border-[#ccd9d1] bg-[#e9efeb] p-[0.35rem]"
            aria-label="Изберете план"
          >
            {(Object.keys(planOptions) as Plan[]).map((item) => (
              <Button
                key={item}
                type="button"
                variant="ghost"
                className="min-h-12 rounded-md p-0 font-[750] text-[#4c625b] hover:bg-transparent aria-pressed:bg-white aria-pressed:text-[#175246] aria-pressed:shadow-[0_1px_5px_rgb(20_56_46/12%)] aria-pressed:hover:bg-white"
                aria-pressed={plan === item}
                onClick={() => choosePlan(item)}
              >
                {planOptions[item].label}
              </Button>
            ))}
          </div>
          <p className="mt-3 mb-0 text-[0.9rem] text-tone-687b75">
            {option.description}
          </p>
        </div>

        <div className={section}>
          <span className={step}>02</span>
          <h2 className={sectionTitle}>Колко често?</h2>
          <div
            className="grid grid-cols-3 gap-[0.4rem] sm:gap-[0.65rem]"
            aria-label="Бърз избор на посещения"
          >
            {quickVisits.map((count) => (
              <Button
                key={count}
                type="button"
                variant="secondary"
                className="relative grid min-h-24 place-content-center sm:min-h-[104px] gap-[0.15rem] rounded-lg border-[#ccd9d1] p-0 font-normal text-[#50645e] hover:bg-white aria-pressed:border-2 aria-pressed:border-[#175246] aria-pressed:bg-[#edf4ef] aria-pressed:text-[#175246] aria-pressed:hover:bg-[#edf4ef]"
                aria-pressed={visits === count}
                onClick={() => setVisits(count)}
              >
                <strong className="text-[1.55rem]">{count}</strong>
                <span className="text-[0.82rem]">
                  {count === 1 ? "посещение" : "посещения"}
                </span>
                {count === 2 && (
                  <small className="absolute -top-[0.65rem] left-1/2 -translate-x-1/2 rounded-[4px] bg-[#d7ef77] px-2 py-[0.18rem] text-xs font-[800] whitespace-nowrap text-[#29443c]">
                    Препоръчано
                  </small>
                )}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex flex-col items-start justify-between gap-4 text-[0.9rem] font-[650] text-[#3f554e] sm:flex-row sm:items-center">
            <span>Посещения на месец</span>
            <div className="grid grid-cols-[44px_46px_44px] items-center overflow-hidden rounded-[7px] border border-[#ccd9d1] bg-white">
              <Button
                type="button"
                variant="ghost"
                className={stepperButton}
                aria-label="Намали посещенията"
                disabled={visits === 1}
                onClick={() => setVisits((current) => Math.max(1, current - 1))}
              >
                −
              </Button>
              <output className="text-center font-[800]" aria-live="polite">
                {visits}
              </output>
              <Button
                type="button"
                variant="ghost"
                className={stepperButton}
                aria-label="Увеличи посещенията"
                disabled={visits === 8}
                onClick={() => setVisits((current) => Math.min(8, current + 1))}
              >
                +
              </Button>
            </div>
          </div>
          {discount && (
            <p className="mt-[0.8rem] mb-0 inline-block rounded-[5px] bg-[#dff0a2] px-[0.55rem] py-[0.35rem] text-[0.78rem] font-[800] text-[#315338]">
              {discountPercent}% отстъпка за редовна грижа
            </p>
          )}
        </div>

        <div className={section}>
          <span className={step}>03</span>
          <h2 className={sectionTitle}>Размер на имота</h2>
          <Label className="m-0 leading-[1.55] text-[#40564f]">
            {option.quantityLabel}
            <span className="mt-[0.45rem] grid grid-cols-[1fr_auto] items-center overflow-hidden rounded-[7px] border border-[#ccd9d1] bg-white">
              <Input
                type="number"
                min="1"
                max="1000"
                step="1"
                className="m-0 h-[50px] rounded-none border-0 px-[0.9rem] py-0"
                value={quantity}
                aria-describedby={
                  errors.quantity ? "quantity-error" : undefined
                }
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
              <strong className="px-4 text-[0.9rem] text-[#60746d]">
                {option.unit}
              </strong>
            </span>
          </Label>
          {errors.quantity && (
            <p id="quantity-error" className={cn(errorText, "mb-0")}>
              {errors.quantity}
            </p>
          )}
        </div>

        <div className="border-l-[3px] border-[#98bd78] bg-[#edf3ea] p-6">
          <h2 className="mt-0 mb-[1.2rem] text-[1.35rem] text-[#17372f]">
            Включено във всяко посещение
          </h2>
          <ul className="m-0 grid list-none gap-[0.6rem] p-0 text-[#425850]">
            {option.features.map((feature) => (
              <li key={feature} className={checkItem}>
                {feature}
              </li>
            ))}
            {visits >= 4 && (
              <li className={checkItem}>Приоритетно пренасрочване</li>
            )}
            {visits >= 8 && (
              <li className={checkItem}>Един и същ екип по постоянен график</li>
            )}
          </ul>
        </div>
      </section>

      <aside
        className="lg:sticky lg:top-[100px]"
        aria-labelledby="summary-title"
      >
        <Card className="rounded-lg border-[#cad8d0] p-6 md:p-8 shadow-[0_16px_45px_rgb(22_60_50/9%)]">
          <div className="flex items-center justify-between">
            <span className={step}>ВАШИЯТ ПЛАН</span>
            {discount && (
              <strong className="rounded-[4px] bg-[#d7ef77] px-[0.45rem] py-1 text-[0.75rem] text-[#274c3d]">
                −{discountPercent}%
              </strong>
            )}
          </div>
          <h2
            id="summary-title"
            className="mt-[0.45rem] mb-0 text-[1.65rem] text-[#153c33]"
          >
            {option.label}
          </h2>
          <p className="mt-[0.3rem] mb-[1.2rem] text-[0.88rem] text-tone-687b75">
            {visits} {visits === 1 ? "посещение" : "посещения"} месечно ·{" "}
            {quantity || "—"} {option.unit}
          </p>
          <div
            className="flex items-baseline gap-[0.45rem] border-y border-[#e1e8e3] py-4"
            aria-live="polite"
          >
            <strong className="text-[2rem] text-[#17372f]">
              {price === null ? "—" : money(price)}
            </strong>
            <span className="text-tone-687b75">/ месец</span>
          </div>
          <p className="mt-[0.7rem] mb-6 text-[0.76rem] text-tone-687b75">
            {money(tariffs[plan])} × {quantity || "—"} {option.unit} × {visits}{" "}
            посещения
            {discount && ` × ${((100 - discountPercent) / 100).toFixed(2)}`}
          </p>

          {renderForm(false)}
        </Card>
      </aside>

      {!sheetOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[#cad8d0] bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgb(22_60_50/10%)] lg:hidden">
          <div className="grid" aria-live="polite">
            <strong className="text-[1.25rem] text-[#17372f]">
              {price === null ? "—" : money(price)}
              <span className="ml-1 text-xs font-normal text-tone-687b75">
                / месец
              </span>
            </strong>
            <span className="text-xs text-tone-687b75">
              {visits} {visits === 1 ? "посещение" : "посещения"} ·{" "}
              {quantity || "—"} {option.unit}
            </span>
          </div>
          <Button
            type="button"
            className="min-h-12 rounded-[7px] bg-[#175246] px-5 font-extrabold hover:bg-[#103c33]"
            onClick={() => setSheetOpen(true)}
          >
            Заявете старт
          </Button>
        </div>
      )}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent>{renderForm(true)}</DialogContent>
      </Dialog>
    </div>
  );
}

function FormBody({
  inSheet,
  className,
  children,
}: {
  inSheet: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return inSheet ? (
    <DialogBody className={className}>{children}</DialogBody>
  ) : (
    <div className={className}>{children}</div>
  );
}

function FormFoot({
  inSheet,
  className,
  children,
}: {
  inSheet: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return inSheet ? (
    <DialogFooter className="flex-col-reverse sm:flex-col">
      <div className="grid w-full gap-3">{children}</div>
    </DialogFooter>
  ) : (
    <div className={className}>{children}</div>
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
    <Label className={fieldLabel}>
      {label}
      {children}
      {error && (
        <span id={id} className={errorText}>
          {error}
        </span>
      )}
    </Label>
  );
}
