import { Role } from "@/domain/requests/types";
import type { ClientRegistrationInput } from "@/domain/identity/types";
import {
  AuthCheckbox,
  AuthField,
  AuthLabel,
  AuthLink,
  FieldError,
  PasswordInput,
  Required,
  TextField,
} from "../auth-ui";
import type { ClientRegistrationErrors } from "../validation";

interface AccountFieldsProps {
  idPrefix: string;
  data: ClientRegistrationInput;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: ClientRegistrationErrors;
  showPassword: boolean;
  onTogglePassword: () => void;
  termsLabel: Role;
}

/** Step 1 fields shared by the client form and the specialist account step. */
export function AccountFields({
  idPrefix,
  data,
  onChange,
  onCheckboxChange,
  errors,
  showPassword,
  onTogglePassword,
  termsLabel,
}: AccountFieldsProps) {
  const isClient = idPrefix === "client";

  return (
    <>
      <TextField
        id={`${idPrefix}-name`}
        label="Име и фамилия"
        required
        name="name"
        type="text"
        autoComplete="name"
        enterKeyHint="next"
        value={data.name}
        onChange={onChange}
        placeholder={isClient ? "Иван Иванов" : "Димитър Петров"}
        error={errors.name}
      />

      <TextField
        id={`${idPrefix}-email`}
        label="Имейл адрес"
        required
        name="email"
        type="email"
        autoComplete="email"
        enterKeyHint="next"
        value={data.email}
        onChange={onChange}
        placeholder={isClient ? "ivan@example.bg" : "dimitar@example.bg"}
        error={errors.email}
      />

      <TextField
        id={`${idPrefix}-phone`}
        label="Телефонен номер"
        required
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        enterKeyHint="next"
        value={data.phone}
        onChange={onChange}
        placeholder={isClient ? "0888 123 456" : "0888 765 432"}
        error={errors.phone}
      />

      <AuthField>
        <AuthLabel htmlFor={`${idPrefix}-password`}>
          Парола <Required />
        </AuthLabel>
        <PasswordInput
          id={`${idPrefix}-password`}
          name="password"
          autoComplete="new-password"
          enterKeyHint="done"
          required
          value={data.password}
          onChange={onChange}
          placeholder="Поне 6 символа"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? `${idPrefix}-password-error` : undefined
          }
          showPassword={showPassword}
          onToggle={onTogglePassword}
        />
        {errors.password && (
          <FieldError id={`${idPrefix}-password-error`}>
            {errors.password}
          </FieldError>
        )}
      </AuthField>

      <div className="mt-1">
        <AuthLabel className="flex min-h-11 cursor-pointer items-start gap-2.5 py-2 text-[14px] leading-[1.4]">
          <AuthCheckbox
            id={`${idPrefix}-terms`}
            name="termsAccepted"
            checked={data.termsAccepted}
            onChange={onCheckboxChange}
            aria-invalid={Boolean(errors.termsAccepted)}
            aria-describedby={
              errors.termsAccepted ? `${idPrefix}-terms-error` : undefined
            }
          />
          <span>
            Съгласен съм с{" "}
            <AuthLink href="/terms">
              {termsLabel === Role.Client
                ? "Общите условия"
                : "Общите условия за партньори"}
            </AuthLink>{" "}
            и <AuthLink href="/privacy">Политиката за поверителност</AuthLink>
          </span>
        </AuthLabel>
        {errors.termsAccepted && (
          <FieldError id={`${idPrefix}-terms-error`}>
            {errors.termsAccepted}
          </FieldError>
        )}
      </div>
    </>
  );
}
