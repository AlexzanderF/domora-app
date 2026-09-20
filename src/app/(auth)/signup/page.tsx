"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import {
  validateClientRegistration,
  type ClientRegistrationErrors,
} from "@/features/auth/validation";
import type { ClientRegistrationInput } from "@/features/auth/types";
import styles from "../auth.module.css";

export default function SignUpPage() {
  const router = useRouter();
  const { registerClient } = useAuth();

  const [formData, setFormData] = useState<ClientRegistrationInput>({
    name: "",
    email: "",
    phone: "",
    password: "",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<ClientRegistrationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts editing
    if (errors[name as keyof ClientRegistrationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));

    if (errors.termsAccepted) {
      setErrors((prev) => ({
        ...prev,
        termsAccepted: undefined,
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGeneralError(null);

    const validation = validateClientRegistration(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await registerClient(formData);
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Възникна непредвидена грешка при регистрацията.";
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>Регистрация на клиент</h1>
      <p className={styles.subtitle}>
        Създайте профил за бързо и лесно управление на вашите домашни услуги.
      </p>

      {generalError && (
        <div
          className={styles.alertError}
          role="alert"
          style={{ marginBottom: "18px" }}
        >
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Име и фамилия <span className={styles.required}>*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Иван Иванов"
            className={errors.name ? styles.inputError : styles.input}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <span id="name-error" className={styles.errorMessage} role="alert">
              {errors.name}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Имейл адрес <span className={styles.required}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="ivan@example.bg"
            className={errors.email ? styles.inputError : styles.input}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <span id="email-error" className={styles.errorMessage} role="alert">
              {errors.email}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="phone" className={styles.label}>
            Телефонен номер <span className={styles.required}>*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="0888 123 456"
            className={errors.phone ? styles.inputError : styles.input}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <span id="phone-error" className={styles.errorMessage} role="alert">
              {errors.phone}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            Парола <span className={styles.required}>*</span>
          </label>
          <div className={styles.passwordWrapper}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Поне 6 символа"
              className={
                errors.password
                  ? styles.passwordInputError
                  : styles.passwordInput
              }
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className={styles.passwordToggle}
              aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}
            >
              {showPassword ? "Скрий" : "Покажи"}
            </button>
          </div>
          {errors.password && (
            <span
              id="password-error"
              className={styles.errorMessage}
              role="alert"
            >
              {errors.password}
            </span>
          )}
        </div>

        <div className={styles.checkboxField}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleCheckboxChange}
              className={styles.checkbox}
              aria-invalid={Boolean(errors.termsAccepted)}
              aria-describedby={
                errors.termsAccepted ? "terms-error" : undefined
              }
            />
            <span>
              Съгласен съм с{" "}
              <Link href="/terms" className={styles.link}>
                Общите условия
              </Link>{" "}
              и{" "}
              <Link href="/privacy" className={styles.link}>
                Политиката за поверителност
              </Link>
            </span>
          </label>
          {errors.termsAccepted && (
            <span id="terms-error" className={styles.errorMessage} role="alert">
              {errors.termsAccepted}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? "Регистрация..." : "Създай профил"}
        </button>
      </form>

      <p className={styles.switchPrompt}>
        Вече имате профил?{" "}
        <Link href="/login" className={styles.link}>
          Вход
        </Link>
      </p>

      <div className={styles.specialistSection}>
        <p>
          Вие сте майстор или фирма за услуги?{" "}
          <Link href="/specialist" className={styles.link}>
            Кандидатствайте като специалист
          </Link>
        </p>
      </div>
    </>
  );
}
