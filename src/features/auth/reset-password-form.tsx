"use client";

import { useState } from "react";
import { ResetLinkInvalid } from "./reset-link-invalid";
import { resetPasswordAction } from "./server/actions";
import { validatePassword } from "./validation";
import {
  AuthAlert,
  AuthField,
  AuthForm,
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
        <AuthTitle>Паролата е сменена</AuthTitle>
        <AuthAlert tone="success" role="status">
          Новата ви парола е запазена. Влезте в профила си с нея.
        </AuthAlert>
        <SwitchPrompt>
          <AuthLink href="/login">Към вход</AuthLink>
        </SwitchPrompt>
      </>
    );
  }

  return (
    <>
      <AuthTitle>Нова парола</AuthTitle>
      <AuthSubtitle>
        Въведете новата парола за вашия профил в DOMORA.
      </AuthSubtitle>

      <AuthForm onSubmit={handleSubmit}>
        <AuthField>
          <AuthLabel htmlFor="password">
            Нова парола <Required />
          </AuthLabel>
          <PasswordInput
            id="password"
            name="password"
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
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "password-error" : undefined}
            showPassword={showPassword}
            onToggle={() => setShowPassword((shown) => !shown)}
          />
          {error && <FieldError id="password-error">{error}</FieldError>}
        </AuthField>

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Запазване..." : "Запази новата парола"}
        </SubmitButton>
      </AuthForm>
    </>
  );
}
