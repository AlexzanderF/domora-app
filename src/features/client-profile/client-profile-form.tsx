"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { useToast } from "@/components/ui/toast-provider";
import {
  updateClientProfileAction,
  type ClientProfileErrors,
} from "./server/actions";
import styles from "./client-profile.module.css";

interface ClientProfileFormProps {
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
}

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
  const [values, setValues] = useState({
    name,
    email,
    phone,
    propertyAddress,
  });
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
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formHeader}>
        <div>
          <span className={styles.eyebrow}>КОНТАКТИ</span>
          <h2>Редакция на профила</h2>
        </div>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          Име и фамилия
          <input
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={
              fieldErrors.name ? "profile-name-error" : undefined
            }
            disabled={isPending}
          />
          {fieldErrors.name && (
            <span className={styles.errorText} id="profile-name-error">
              {fieldErrors.name}
            </span>
          )}
        </label>

        <label className={styles.field}>
          Имейл
          <input
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
            <span className={styles.errorText} id="profile-email-error">
              {fieldErrors.email}
            </span>
          )}
        </label>

        <label className={styles.field}>
          Телефон
          <input
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={
              fieldErrors.phone ? "profile-phone-error" : undefined
            }
            disabled={isPending}
          />
          {fieldErrors.phone && (
            <span className={styles.errorText} id="profile-phone-error">
              {fieldErrors.phone}
            </span>
          )}
        </label>

        <label className={`${styles.field} ${styles.fieldWide}`}>
          Адрес на имота
          <input
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
            placeholder="Град, улица, номер, вход, апартамент"
          />
          {fieldErrors.propertyAddress && (
            <span
              className={styles.errorText}
              id="profile-property-address-error"
            >
              {fieldErrors.propertyAddress}
            </span>
          )}
        </label>
      </div>

      <div className={styles.saveBar}>
        <div className={styles.saveBarStatus}>
          {formError && (
            <p className={styles.errorNotice} role="alert">
              {formError}
            </p>
          )}
          {formMessage && (
            <p className={styles.successNotice} role="status">
              {formMessage}
            </p>
          )}
          {!formError && !formMessage && (
            <p className={styles.saveHint}>
              Запазете промените, за да обновите профила си.
            </p>
          )}
        </div>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Запазване..." : "Запази промените"}
        </button>
      </div>
    </form>
  );
}
