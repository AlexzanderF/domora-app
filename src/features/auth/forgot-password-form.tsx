"use client";

import { useState } from "react";
import { requestPasswordResetAction } from "./server/actions";
import { validateEmail } from "./validation";
import {
  AuthAlert,
  AuthField,
  AuthForm,
  AuthInput,
  AuthLabel,
  AuthLink,
  AuthSubtitle,
  AuthTitle,
  FieldError,
  Required,
  SubmitButton,
  SwitchPrompt,
} from "./auth-ui";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitted(false);
    setIsSubmitting(true);
    try {
      const result = await requestPasswordResetAction(email);
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Възникна грешка. Моля, опитайте отново.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AuthTitle>Забравена парола</AuthTitle>
      <AuthSubtitle>
        Въведете вашия имейл адрес, за да получите инструкции за възстановяване
        на паролата.
      </AuthSubtitle>

      {isSubmitted && (
        <AuthAlert tone="success" role="status" className="mb-5">
          Ако има профил с този имейл адрес, изпратихме на него връзка за смяна
          на паролата. Моля, проверете входящата си поща.
        </AuthAlert>
      )}

      <AuthForm onSubmit={handleSubmit}>
        <AuthField>
          <AuthLabel htmlFor="email">
            Имейл адрес <Required />
          </AuthLabel>
          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            enterKeyHint="done"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="ivan@example.bg"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "email-error" : undefined}
          />
          {error && <FieldError id="email-error">{error}</FieldError>}
        </AuthField>

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Изпращане..." : "Изпрати връзка за възстановяване"}
        </SubmitButton>
      </AuthForm>

      <SwitchPrompt>
        <AuthLink href="/login">Обратно към вход</AuthLink>
      </SwitchPrompt>
    </>
  );
}
