"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { UserRole, UserStatus } from "./types";
import { validateLogin, type LoginErrors } from "./validation";
import styles from "./auth.module.css";

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.65-.79 1.1-1.9 0.98-3-.95.04-2.1.63-2.77 1.42-.59.68-1.12 1.8-0.97 2.87 1.07.08 2.14-.52 2.76-1.29z" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const { login, logout } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorBanner(null);

    const validation = validateLogin(identifier, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    try {
      setIsSubmitting(true);
      const result = await login(identifier, password, rememberMe);
      if (!result.success) {
        setErrorBanner(result.error ?? "Невалиден имейл/телефон или парола.");
        return;
      }

      router.refresh();

      if (result.user?.role === UserRole.Specialist) {
        if (result.user.status === UserStatus.Pending) {
          router.push("/pending-approval");
          return;
        }
        if (result.user.status === UserStatus.Rejected) {
          await logout();
          setErrorBanner(
            "Кандидатурата ви като специалист е отказана. За повече информация се свържете с екипа на DOMORA.",
          );
          return;
        }
        router.push("/specialist");
        return;
      }

      if (result.user?.role === UserRole.Admin) {
        router.push("/admin");
        return;
      }

      router.push("/client");
    } catch {
      setErrorBanner("Възникна грешка при влизането в профила.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>Вход в DOMORA</h1>
      <p className={styles.subtitle}>
        Влезте в профила си, за да управлявате вашите заявки и услуги.
      </p>

      {errorBanner && (
        <div
          className={styles.alertError}
          role="alert"
          style={{ marginBottom: "18px" }}
        >
          {errorBanner}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.field}>
          <label htmlFor="identifier" className={styles.label}>
            Имейл адрес или телефон <span className={styles.required}>*</span>
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) {
                setErrors((prev) => ({ ...prev, identifier: undefined }));
              }
              if (errorBanner) setErrorBanner(null);
            }}
            placeholder="ivan@example.bg или 0888 123 456"
            className={errors.identifier ? styles.inputError : styles.input}
            aria-invalid={Boolean(errors.identifier)}
            aria-describedby={
              errors.identifier ? "identifier-error" : undefined
            }
          />
          {errors.identifier && (
            <span
              id="identifier-error"
              className={styles.errorMessage}
              role="alert"
            >
              {errors.identifier}
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
                if (errorBanner) setErrorBanner(null);
              }}
              placeholder="Въведете парола"
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

        <div className={styles.formRowBetween}>
          <label className={styles.rememberMeLabel}>
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Запомни ме</span>
          </label>
          <Link href="/forgot-password" className={styles.forgotLink}>
            Забравена парола?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? "Влизане..." : "Вход"}
        </button>
      </form>

      <div className={styles.divider}>
        <span>или продължете с</span>
      </div>

      <div className={styles.socialButtons}>
        <button
          type="button"
          className={styles.socialButton}
          aria-label="Вход с Google"
        >
          <GoogleIcon />
          <span>Вход с Google</span>
        </button>
        <button
          type="button"
          className={styles.socialButton}
          aria-label="Вход с Apple"
        >
          <AppleIcon />
          <span>Вход с Apple</span>
        </button>
      </div>

      <p className={styles.switchPrompt}>
        Нямате профил?{" "}
        <Link href="/signup" className={styles.link}>
          Регистрация
        </Link>
      </p>
    </>
  );
}
