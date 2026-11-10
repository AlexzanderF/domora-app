import { Role } from "@/domain/requests/types";
import type { ClientRegistrationInput } from "@/domain/identity/types";
import { AuthForm, SubmitButton } from "../auth-ui";
import type { SpecialistRegistrationErrors } from "../validation";
import { AccountFields } from "./account-fields";

interface SpecialistAccountStepProps {
  data: ClientRegistrationInput;
  errors: SpecialistRegistrationErrors;
  showPassword: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onNext: (event: React.MouseEvent) => void;
}

/** Specialist step 1: account details. */
export function SpecialistAccountStep({
  data,
  errors,
  showPassword,
  onChange,
  onCheckboxChange,
  onTogglePassword,
  onNext,
}: SpecialistAccountStepProps) {
  return (
    <AuthForm>
      <AccountFields
        idPrefix="spec"
        data={data}
        onChange={onChange}
        onCheckboxChange={onCheckboxChange}
        errors={errors}
        showPassword={showPassword}
        onTogglePassword={onTogglePassword}
        termsLabel={Role.Specialist}
      />

      <SubmitButton type="button" onClick={onNext}>
        Продължи към стъпка 2 →
      </SubmitButton>
    </AuthForm>
  );
}
