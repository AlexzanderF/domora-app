"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError("Моля, въведете имейл или телефон.");
      return;
    }

    if (!password) {
      setError("Моля, въведете парола.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login(identifier, password);
      if (!result.success) {
        setError(result.error ?? "Невалиден имейл/телефон или грешна парола.");
        return;
      }
      if (
        result.user?.role === "SPECIALIST" &&
        result.user.status === "PENDING"
      ) {
        router.push("/pending-approval");
      } else if (result.user?.role === "SPECIALIST") {
        router.push("/specialist");
      } else if (result.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch {
      setError("Възникна грешка при влизането в профила.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
    setIsSubmitting(true);
    const result = await login(id, pass);
    setIsSubmitting(false);
    if (result.success && result.user) {
      if (
        result.user.role === "SPECIALIST" &&
        result.user.status === "PENDING"
      ) {
        router.push("/pending-approval");
      } else if (result.user.role === "SPECIALIST") {
        router.push("/specialist");
      } else if (result.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } else {
      setError(result.error ?? "Неуспешен вход.");
    }
  };

  return (
    <>
      <h1 className={styles.title}>Вход в DOMORA</h1>
      <p className={styles.subtitle}>
        Влезте в профила си, за да управлявате вашите заявки и услуги.
      </p>

      {error && (
        <div
          className={styles.alertError}
          role="alert"
          style={{ marginBottom: "18px" }}
        >
          {error}
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
              if (error) setError(null);
            }}
            placeholder="ivan@example.bg или 0888 123 456"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label htmlFor="password" className={styles.label}>
              Парола <span className={styles.required}>*</span>
            </label>
          </div>
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
                if (error) setError(null);
              }}
              placeholder="Въведете парола"
              className={styles.passwordInput}
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
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? "Влизане..." : "Вход"}
        </button>
      </form>

      <p className={styles.switchPrompt}>
        Нямате профил?{" "}
        <Link href="/signup" className={styles.link}>
          Регистрация
        </Link>
      </p>

      <div className={styles.specialistSection}>
        <p
          style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}
        >
          Бърз демо вход:
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() => handleQuickLogin("client@domora.bg", "password123")}
            className="secondary"
            style={{ padding: "6px 10px", fontSize: "12px" }}
          >
            Клиент
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickLogin("georgi@el-service.bg", "password123")
            }
            className="secondary"
            style={{ padding: "6px 10px", fontSize: "12px" }}
          >
            Специалист
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickLogin("dimitar@vik-master.bg", "password123")
            }
            className="secondary"
            style={{ padding: "6px 10px", fontSize: "12px" }}
          >
            Чакащ специалист
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("admin@domora.bg", "adminpassword")}
            className="secondary"
            style={{ padding: "6px 10px", fontSize: "12px" }}
          >
            Администратор
          </button>
        </div>
      </div>
    </>
  );
}
