"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { validateLogin, type LoginErrors } from "./validation";
import {
  AuthAlert,
  AuthCheckbox,
  AuthField,
  AuthForm,
  AuthInput,
  AuthLabel,
  AuthLink,
  AuthSubtitle,
  AuthTitle,
  FieldError,
  PasswordInput,
  Required,
  SubmitButton,
  SwitchPrompt,
} from "./auth-ui";

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
      <AuthTitle>Вход в DOMORA</AuthTitle>
      <AuthSubtitle>
        Влезте в профила си, за да управлявате вашите заявки и услуги.
      </AuthSubtitle>

      {errorBanner && (
        <AuthAlert tone="error" role="alert" className="mb-[18px]">
          {errorBanner}
        </AuthAlert>
      )}

      <AuthForm onSubmit={handleSubmit}>
        <AuthField>
          <AuthLabel htmlFor="identifier">
            Имейл адрес или телефон <Required />
          </AuthLabel>
          <AuthInput
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            enterKeyHint="next"
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
            aria-invalid={Boolean(errors.identifier)}
            aria-describedby={
              errors.identifier ? "identifier-error" : undefined
            }
          />
          {errors.identifier && (
            <FieldError id="identifier-error">{errors.identifier}</FieldError>
          )}
        </AuthField>

        <AuthField>
          <AuthLabel htmlFor="password">
            Парола <Required />
          </AuthLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            enterKeyHint="done"
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
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            showPassword={showPassword}
            onToggle={() => setShowPassword((prev) => !prev)}
          />
          {errors.password && (
            <FieldError id="password-error">{errors.password}</FieldError>
          )}
        </AuthField>

        <div className="flex flex-wrap items-center justify-between gap-x-3">
          <AuthLabel className="inline-flex min-h-11 cursor-pointer items-center gap-2">
            <AuthCheckbox
              id="rememberMe"
              name="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Запомни ме</span>
          </AuthLabel>
          <AuthLink
            href="/forgot-password"
            className="inline-flex min-h-11 items-center text-[13px] whitespace-nowrap"
          >
            Забравена парола?
          </AuthLink>
        </div>

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Влизане..." : "Вход"}
        </SubmitButton>
      </AuthForm>

      <SwitchPrompt>
        Нямате профил? <AuthLink href="/signup">Регистрация</AuthLink>
      </SwitchPrompt>
    </>
  );
}
