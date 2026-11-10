"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import {
  updateClientProfileAction,
  type ClientProfileErrors,
} from "./server/actions";

interface ClientProfileFormProps {
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
}

const fieldClass = "mb-0 leading-[1.55]";
const invalidClass =
  "leading-[1.55] aria-invalid:border-tone-c2410c aria-invalid:bg-tone-fff7ed";
const errorTextClass =
  "mt-[0.35rem] block text-[0.82rem] font-semibold text-tone-9a3412";
const noticeClass =
  "m-0 rounded-[9px] border px-[0.95rem] py-[0.8rem] text-[0.9rem] font-semibold";

export function ClientProfileForm({
  name,
  email,
  phone,
  propertyAddress,
}: ClientProfileFormProps) {
  const notify = useToast();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({ name, email, phone, propertyAddress });
  const [fieldErrors, setFieldErrors] = useState<ClientProfileErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");

  function updateField(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormMessage("");
    setFormError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateClientProfileAction(values);
      if (result.success) {
        setValues({
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          propertyAddress: result.user.propertyAddress ?? "",
        });
        setFieldErrors({});
        setFormError("");
        setFormMessage(result.message);
        notify(result.message);
        await refreshUser();
        router.refresh();
        return;
      }

      setFieldErrors(result.fieldErrors ?? {});
      setFormMessage("");
      setFormError(result.error);
      notify(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card className="grid gap-4 rounded-xl p-[1.15rem] pb-0 md:p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <div>
            <span className="mb-[0.3rem] block text-[0.75rem] font-bold tracking-[0.12em] text-muted-foreground">
              КОНТАКТИ И ИМОТ
            </span>
            <h2 className="text-[1.15rem]">Редакция на профила</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Label className={`${fieldClass} col-span-full`}>
            Име и фамилия
            <Input
              className={invalidClass}
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={
                fieldErrors.name ? "profile-name-error" : undefined
              }
              disabled={isPending}
            />
            {fieldErrors.name && (
              <span className={errorTextClass} id="profile-name-error">
                {fieldErrors.name}
              </span>
            )}
          </Label>

          <Label className={fieldClass}>
            Имейл
            <Input
              className={invalidClass}
              type="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? "profile-email-error" : undefined
              }
              disabled={isPending}
            />
            {fieldErrors.email && (
              <span className={errorTextClass} id="profile-email-error">
                {fieldErrors.email}
              </span>
            )}
          </Label>

          <Label className={fieldClass}>
            Телефон
            <Input
              className={invalidClass}
              value={values.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={
                fieldErrors.phone ? "profile-phone-error" : undefined
              }
              disabled={isPending}
            />
            {fieldErrors.phone && (
              <span className={errorTextClass} id="profile-phone-error">
                {fieldErrors.phone}
              </span>
            )}
          </Label>

          <Label className={`${fieldClass} col-span-full`}>
            Адрес на имота
            <Textarea
              className={`min-h-24 ${invalidClass}`}
              value={values.propertyAddress}
              onChange={(event) =>
                updateField("propertyAddress", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.propertyAddress)}
              aria-describedby={
                fieldErrors.propertyAddress
                  ? "profile-property-address-error"
                  : undefined
              }
              disabled={isPending}
              rows={3}
            />
            {fieldErrors.propertyAddress && (
              <span
                className={errorTextClass}
                id="profile-property-address-error"
              >
                {fieldErrors.propertyAddress}
              </span>
            )}
          </Label>
        </div>

        <div className="sticky bottom-0 z-[2] -mx-[1.15rem] grid grid-cols-1 items-center gap-4 border-t border-border bg-white/95 px-[1.15rem] pt-[0.9rem] pb-4 shadow-[0_-12px_24px_rgba(24,43,38,0.08)] md:-mx-6 md:grid-cols-[minmax(0,1fr)_auto] md:px-6 md:py-4">
          <div className="min-w-0">
            {formError && (
              <p
                className={`${noticeClass} border-tone-fed7aa bg-tone-fff7ed text-tone-9a3412`}
                role="alert"
              >
                {formError}
              </p>
            )}
            {formMessage && (
              <p
                className={`${noticeClass} border-tone-b3e7c5 bg-tone-e6f7ec text-tone-176536`}
                role="status"
              >
                {formMessage}
              </p>
            )}
          </div>
          <Button
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg px-4 py-[0.65rem] font-bold disabled:opacity-70 w-full md:w-auto"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Запазване..." : "Запази промените"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
