"use client";

import { useState } from "react";
import Link from "next/link";
import { validateEmail } from "@/features/auth/validation";
import styles from "../auth.module.css";

function generateResetToken(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const token = generateResetToken();
    console.log(
      `[DOMORA Auth] Simulated password reset token for ${email.trim()}: ${token}`,
    );

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <>
      <h1 className={styles.title}>Забравена парола</h1>
      <p className={styles.subtitle}>
        Въведете вашия имейл адрес, за да получите инструкции за възстановяване
        на паролата.
      </p>

      {isSubmitted && (
        <div
          className={styles.noticeBannerSuccess}
          role="status"
          style={{ marginBottom: "20px" }}
        >
          Изпратихме инструкции за възстановяване на паролата на вашия имейл.
          Моля, проверете входящата си поща.
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="ivan@example.bg"
            className={error ? styles.inputError : styles.input}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "email-error" : undefined}
          />
          {error && (
            <span id="email-error" className={styles.errorMessage} role="alert">
              {error}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? "Изпращане..." : "Изпрати връзка за възстановяване"}
        </button>
      </form>

      <p className={styles.switchPrompt}>
        <Link href="/login" className={styles.link}>
          Обратно към вход
        </Link>
      </p>
    </>
  );
}
