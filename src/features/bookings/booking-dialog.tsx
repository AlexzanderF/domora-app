"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { DatePicker } from "@/features/plans/date-picker";
import { TimePicker } from "@/features/plans/time-picker";
import { useBooking } from "./booking-provider";
import { calculateQuote, quoteScope } from "@/domain/pricing";
import { createServiceRequestAction } from "@/features/requests/server/actions";
import { Plan } from "@/domain/requests/types";
import type {
  BookingSelection,
  CategoryId,
  Tariffs,
} from "@/domain/requests/types";
import { categories, isCategoryId } from "@/features/services/catalog";
import { localDate, money } from "@/lib/format";
import { PhotoPicker } from "./photo-picker";
import { uploadRequestPhotos } from "./upload-photos";
import { errorClass, fieldClass } from "./field-styles";

export function BookingDialog({ tariffs }: { tariffs: Tariffs }) {
  const { booking } = useBooking();
  return booking ? (
    <BookingForm
      key={`${booking.category}-${booking.plan ?? "service"}`}
      selection={booking}
      tariffs={tariffs}
    />
  ) : null;
}

function BookingForm({
  selection,
  tariffs,
}: {
  selection: BookingSelection;
  tariffs: Tariffs;
}) {
  const router = useRouter();
  const { closeBooking } = useBooking();
  const notify = useToast();
  const [category, setCategory] = useState<CategoryId>(selection.category);
  const [serviceIndex, setServiceIndex] = useState(0);
  const [quantity, setQuantity] = useState(
    selection.plan === Plan.Entry ? "6" : "80",
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosBusy, setPhotosBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (isSubmitting || photosBusy) return;
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
      nextErrors.quantity = `Въведете ${plan === Plan.Entry ? "брой етажи" : "площ"} между 1 и 1000.`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (price === null) return;

    const serviceName = plan
      ? `Абонамент ${plan === Plan.Home ? "За дома" : "За входа"}`
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

      if (actionResult.success) {
        // The request is saved first; photos attach to it afterwards.
        const upload =
          photos.length && actionResult.request
            ? await uploadRequestPhotos(actionResult.request.id, photos)
            : null;
        closeBooking();
        router.push("/client/requests");
        notify(
          upload && !upload.ok
            ? `Заявката е създадена, но снимките не бяха качени. ${upload.error}`
            : "Заявката е създадена успешно.",
        );
        return;
      }

      notify(
        actionResult.error ?? "Възникна грешка при създаване на заявката.",
      );
    } catch {
      notify("Възникна грешка при създаване на заявката.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) closeBooking();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-h-[min(96vh,820px)] w-[min(720px,94vw)] rounded-[14px] p-[22px] max-[640px]:p-[18px]"
      >
        <div className="mb-4 flex items-start justify-between gap-[18px]">
          <div>
            <span className="text-[0.68rem] font-extrabold tracking-[0.06em] text-[#668078]">
              DOMORA / НОВА ЗАЯВКА
            </span>
            <DialogTitle className="mt-[5px]! mb-0! text-[1.35rem]! leading-[1.18]! text-[#17372f]">
              {plan
                ? `Абонамент ${plan === Plan.Home ? "за дома" : "за входа"}`
                : "Разкажете ни от какво се нуждаете"}
            </DialogTitle>
          </div>
          <DialogClose
            aria-label="Затвори"
            className="grid size-[34px] flex-none cursor-pointer place-items-center rounded-[7px] border border-[#d9e3dd] bg-white text-[1.35rem] leading-none text-[#526b63] hover:border-[#7fa699] hover:text-[#17372f] focus-visible:border-[#7fa699] focus-visible:text-[#17372f]"
          >
            ×
          </DialogClose>
        </div>
        <form className="grid gap-[0.78rem]" onSubmit={submit} noValidate>
          <div className={fieldGridClass}>
            <Label className={fieldClass}>
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
            </Label>
            <Label className={fieldClass}>
              Услуга
              <select
                disabled={Boolean(plan)}
                value={serviceIndex}
                onChange={(event) =>
                  setServiceIndex(Number(event.target.value))
                }
              >
                {plan ? (
                  <option value={0}>
                    {plan === Plan.Home
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
            </Label>
          </div>
          <Field
            label="Описание на проблема"
            error={errors.description}
            id="description-error"
          >
            <Textarea
              name="description"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
              placeholder="Какво трябва да направим?"
              rows={2}
            />
          </Field>
          <div className="grid gap-[0.45rem]">
            <PhotoPicker onChange={setPhotos} onBusyChange={setPhotosBusy} />
          </div>
          <Field label="Адрес" error={errors.address} id="address-error">
            <Input
              name="address"
              autoComplete="street-address"
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
              placeholder="Град, улица, номер, вход"
            />
          </Field>
          <div className={fieldGridClass}>
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
              label={plan === Plan.Entry ? "Брой етажи" : "Площ на дома (м²)"}
              error={errors.quantity}
              id="quantity-error"
            >
              <Input
                type="number"
                min="1"
                max="1000"
                step="1"
                aria-invalid={Boolean(errors.quantity)}
                aria-describedby={
                  errors.quantity ? "quantity-error" : undefined
                }
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </Field>
          )}
          <div
            className="quote flex items-center justify-between gap-4 rounded-[7px] border border-[#dbe5df] bg-[#edf4e8] px-3.5 py-[13px] max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-1.5 [&>span]:max-w-[260px] [&>span]:text-right [&>span]:text-[0.78rem] [&>span]:text-[#40564f] max-[640px]:[&>span]:max-w-none max-[640px]:[&>span]:text-left [&_small]:text-[0.72rem] [&_small]:text-[#687b75] [&_strong]:block [&_strong]:text-[1.38rem] [&_strong]:leading-[1.1] [&_strong]:text-[#17372f]"
            aria-live="polite"
          >
            <div>
              <small>Демонстрационна цена</small>
              <strong>
                {price === null ? "—" : money(price)}
                {plan ? " / месец" : ""}
              </strong>
            </div>
            <span>{quoteScope(category, serviceIndex, plan)}</span>
          </div>
          <p className="m-0! text-[0.8rem] text-[#6d7c76]">
            Часът подлежи на потвърждение. Материали и допълнителна работа се
            одобряват отделно.
          </p>
          <Button
            className="min-h-11 rounded-[7px] py-0 font-extrabold disabled:opacity-70"
            type="submit"
            disabled={isSubmitting || photosBusy}
            aria-label="Изпрати демо заявка"
          >
            {isSubmitting ? "Изпращане..." : "Изпрати демо заявка →"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const fieldGridClass = "grid grid-cols-2 gap-[0.8rem] max-[640px]:grid-cols-1";

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
    <Label className={fieldClass}>
      {label}
      {children}
      {error && (
        <span id={id} className={errorClass}>
          {error}
        </span>
      )}
    </Label>
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
    <div className={fieldClass}>
      <span>{label}</span>
      {children}
      {error && (
        <span id={id} className={errorClass}>
          {error}
        </span>
      )}
    </div>
  );
}
