import { Role } from "@/domain/requests/types";
import type { ClientRegistrationInput } from "@/domain/identity/types";
import { AuthForm, AuthSubtitle, AuthTitle, SubmitButton } from "../auth-ui";
import type { ClientRegistrationErrors } from "../validation";
import { AccountFields } from "./account-fields";

interface ClientSignupFormProps {
  data: ClientRegistrationInput;
  errors: ClientRegistrationErrors;
  isSubmitting: boolean;
  showPassword: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

/** Single-step client registration. */
export function ClientSignupForm({
  data,
  errors,
  isSubmitting,
  showPassword,
  onChange,
  onCheckboxChange,
  onTogglePassword,
  onSubmit,
}: ClientSignupFormProps) {
  return (
    <>
      <AuthTitle>Регистрация на клиент</AuthTitle>
      <AuthSubtitle>
        Създайте профил за бързо и лесно управление на вашите домашни услуги.
      </AuthSubtitle>

      <AuthForm onSubmit={onSubmit}>
        <AccountFields
          idPrefix="client"
          data={data}
          onChange={onChange}
          onCheckboxChange={onCheckboxChange}
          errors={errors}
          showPassword={showPassword}
          onTogglePassword={onTogglePassword}
          termsLabel={Role.Client}
        />

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Регистрация..." : "Създай профил"}
        </SubmitButton>
      </AuthForm>
    </>
  );
}
