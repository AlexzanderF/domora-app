"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import {
  validateClientRegistration,
  validateSpecialistRegistration,
  type ClientRegistrationErrors,
  type SpecialistRegistrationErrors,
} from "./validation";
import { Role } from "@/domain/requests/types";
import { UserStatus } from "@/domain/identity/types";
import type {
  ClientRegistrationInput,
  SpecialistRegistrationInput,
} from "@/domain/identity/types";
import {
  AuthAlert,
  AuthLink,
  AuthSubtitle,
  AuthTitle,
  SwitchPrompt,
} from "./auth-ui";
import { ClientSignupForm } from "./signup/client-signup-form";
import { SpecialistAccountStep } from "./signup/specialist-account-step";
import { SpecialistProfileStep } from "./signup/specialist-profile-step";
import { SpecialistStepIndicator } from "./signup/specialist-step-indicator";

const roleSwitchClass =
  "cursor-pointer border-0 bg-transparent p-0 text-primary hover:underline";

function RoleTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex-1 cursor-pointer rounded-[7px] border-0 bg-transparent px-3.5 py-2.5 text-center text-[14px] font-semibold text-muted-foreground transition-all hover:text-foreground",
        active &&
          "bg-white text-primary shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

function RoleSwitchSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t border-border pt-5 text-center text-[13px] leading-[1.4] text-muted-foreground">
      <p>{children}</p>
    </div>
  );
}

export function SignupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerClient, registerSpecialist } = useAuth();

  const initialRoleParam = searchParams.get("role");
  const [role, setRole] = useState<Role>(
    initialRoleParam === Role.Specialist ? Role.Specialist : Role.Client,
  );

  // Common Step 1 fields
  const [step1Data, setStep1Data] = useState<ClientRegistrationInput>({
    name: "",
    email: "",
    phone: "",
    password: "",
    termsAccepted: false,
  });

  // Specialist Step 2 fields
  const [specialistStep, setSpecialistStep] = useState<1 | 2>(1);
  const [step2Data, setStep2Data] = useState({
    category: "",
    area: "",
    experienceYears: "",
    bio: "",
    companyName: "",
    eik: "",
  });

  const [clientErrors, setClientErrors] = useState<ClientRegistrationErrors>(
    {},
  );
  const [specialistErrors, setSpecialistErrors] =
    useState<SpecialistRegistrationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field change handler for Step 1
  const handleStep1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setStep1Data((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (clientErrors[name as keyof ClientRegistrationErrors]) {
      setClientErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    if (specialistErrors[name as keyof SpecialistRegistrationErrors]) {
      setSpecialistErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleStep1CheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, checked } = event.target;
    setStep1Data((prev) => ({
      ...prev,
      [name]: checked,
    }));

    if (clientErrors.termsAccepted) {
      setClientErrors((prev) => ({
        ...prev,
        termsAccepted: undefined,
      }));
    }
    if (specialistErrors.termsAccepted) {
      setSpecialistErrors((prev) => ({
        ...prev,
        termsAccepted: undefined,
      }));
    }
  };

  // Field change handler for Step 2
  const handleStep2Change = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setStep2Data((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (specialistErrors[name as keyof SpecialistRegistrationErrors]) {
      setSpecialistErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  // Switch role handler
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setGeneralError(null);
    setClientErrors({});
    setSpecialistErrors({});
  };

  // Client form submit
  const handleClientSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGeneralError(null);

    const validation = validateClientRegistration(step1Data);
    if (!validation.isValid) {
      setClientErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await registerClient(step1Data);
      router.refresh();
      router.push("/client");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Възникна непредвидена грешка при регистрацията.";
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Specialist advance to Step 2
  const handleSpecialistStep1Next = (event: React.MouseEvent) => {
    event.preventDefault();
    setGeneralError(null);

    const validation = validateClientRegistration(step1Data);
    if (!validation.isValid) {
      setSpecialistErrors(validation.errors);
      return;
    }

    setSpecialistErrors({});
    setSpecialistStep(2);
  };

  // Specialist form submit (Step 2)
  const handleSpecialistSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGeneralError(null);

    const fullSpecialistInput: SpecialistRegistrationInput = {
      ...step1Data,
      category: step2Data.category,
      area: step2Data.area,
      experienceYears:
        step2Data.experienceYears === ""
          ? -1
          : Number(step2Data.experienceYears),
      bio: step2Data.bio,
      companyName: step2Data.companyName || undefined,
      eik: step2Data.eik || undefined,
    };

    const validation = validateSpecialistRegistration(fullSpecialistInput);
    if (!validation.isValid) {
      setSpecialistErrors(validation.errors);
      const hasStep1Error = Boolean(
        validation.errors.name ||
        validation.errors.email ||
        validation.errors.phone ||
        validation.errors.password ||
        validation.errors.termsAccepted,
      );
      if (hasStep1Error) {
        setSpecialistStep(1);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const newUser = await registerSpecialist(fullSpecialistInput);
      router.refresh();
      if (newUser.status === UserStatus.Pending) {
        router.push("/pending-approval");
      } else {
        router.push("/specialist");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Възникна непредвидена грешка при изпращането на кандидатурата.";
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Role Switcher Tabs */}
      <div
        className="mb-6 flex gap-1 rounded-[10px] border border-border bg-background p-1"
        role="tablist"
        aria-label="Избор на тип регистрация"
      >
        <RoleTab
          active={role === Role.Client}
          onClick={() => handleRoleChange(Role.Client)}
        >
          Клиент
        </RoleTab>
        <RoleTab
          active={role === Role.Specialist}
          onClick={() => handleRoleChange(Role.Specialist)}
        >
          Специалист
        </RoleTab>
      </div>

      {generalError && (
        <AuthAlert tone="error" role="alert" className="mb-[18px]">
          {generalError}
        </AuthAlert>
      )}

      {role === Role.Client && (
        <>
          <ClientSignupForm
            data={step1Data}
            errors={clientErrors}
            isSubmitting={isSubmitting}
            showPassword={showPassword}
            onChange={handleStep1Change}
            onCheckboxChange={handleStep1CheckboxChange}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
            onSubmit={handleClientSubmit}
          />

          <SwitchPrompt>
            Вече имате профил? <AuthLink href="/login">Вход</AuthLink>
          </SwitchPrompt>

          <RoleSwitchSection>
            Вие сте майстор или фирма за услуги?{" "}
            <button
              type="button"
              onClick={() => handleRoleChange(Role.Specialist)}
              className={roleSwitchClass}
            >
              Кандидатствайте като специалист
            </button>
          </RoleSwitchSection>
        </>
      )}

      {role === Role.Specialist && (
        <>
          <AuthTitle>Кандидатствайте като специалист</AuthTitle>
          <AuthSubtitle>
            Присъединете се към партньорската мрежа на DOMORA и получавайте
            заявки от проверени клиенти.
          </AuthSubtitle>

          <SpecialistStepIndicator step={specialistStep} />

          {specialistStep === 1 && (
            <SpecialistAccountStep
              data={step1Data}
              errors={specialistErrors}
              showPassword={showPassword}
              onChange={handleStep1Change}
              onCheckboxChange={handleStep1CheckboxChange}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
              onNext={handleSpecialistStep1Next}
            />
          )}

          {specialistStep === 2 && (
            <SpecialistProfileStep
              data={step2Data}
              errors={specialistErrors}
              isSubmitting={isSubmitting}
              onChange={handleStep2Change}
              onBack={() => setSpecialistStep(1)}
              onSubmit={handleSpecialistSubmit}
            />
          )}

          <SwitchPrompt>
            Вече имате профил? <AuthLink href="/login">Вход</AuthLink>
          </SwitchPrompt>

          <RoleSwitchSection>
            Търсите майстор за дома си?{" "}
            <button
              type="button"
              onClick={() => handleRoleChange(Role.Client)}
              className={roleSwitchClass}
            >
              Регистрирайте се като клиент
            </button>
          </RoleSwitchSection>
        </>
      )}
    </>
  );
}
