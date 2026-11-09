"use client";

import { useState } from "react";
import Link from "next/link";
import { ResetLinkInvalid } from "./reset-link-invalid";
import { resetPasswordAction } from "./server/actions";
import { validatePassword } from "./validation";
import styles from "./auth.module.css";

type Outcome = "editing" | "done" | "invalidLink";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>("editing");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const result = await resetPasswordAction(token, password);
      if (result.success) {
        setOutcome("done");
      } else if (result.invalidLink) {
        setOutcome("invalidLink");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Възникна грешка. Моля, опитайте отново.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (outcome === "invalidLink") {
    return <ResetLinkInvalid />;
  }

  if (outcome === "done") {
    return (
      <>
        <h1 className={styles.title}>Паролата е сменена</h1>
        <div className={styles.noticeBannerSuccess} role="status">
          Новата ви парола е запазена. Влезте в профила си с нея.
        </div>
        <p className={styles.switchPrompt}>
          <Link href="/login" className={styles.link}>
            Към вход
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className={styles.title}>Нова парола</h1>
      <p className={styles.subtitle}>
        Въведете новата парола за вашия профил в DOMORA.
      </p>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            Нова парола <span className={styles.required}>*</span>
          </label>
          <div className={styles.passwordWrapper}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Поне 6 символа"
              className={
                error ? styles.passwordInputError : styles.passwordInput
              }
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              className={styles.passwordToggle}
              aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}
            >
              {showPassword ? "Скрий" : "Покажи"}
            </button>
          </div>
          {error && (
            <span
              id="password-error"
              className={styles.errorMessage}
              role="alert"
            >
              {error}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? "Запазване..." : "Запази новата парола"}
        </button>
      </form>
    </>
  );
}
