"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./auth-provider";
import {
  SPECIALIST_CATEGORIES,
  validateClientRegistration,
  validateSpecialistRegistration,
  type ClientRegistrationErrors,
  type SpecialistRegistrationErrors,
} from "./validation";
import type {
  ClientRegistrationInput,
  SpecialistRegistrationInput,
} from "./types";
import styles from "./auth.module.css";

interface AccountFieldsProps {
  idPrefix: string;
  data: ClientRegistrationInput;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: ClientRegistrationErrors;
  showPassword: boolean;
  onTogglePassword: () => void;
  termsLabel: "client" | "specialist";
}

function AccountFields({
  idPrefix,
  data,
  onChange,
  onCheckboxChange,
  errors,
  showPassword,
  onTogglePassword,
  termsLabel,
}: AccountFieldsProps) {
  return (
    <>
      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-name`} className={styles.label}>
          Име и фамилия <span className={styles.required}>*</span>
        </label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          type="text"
          autoComplete="name"
          required
          value={data.name}
          onChange={onChange}
          placeholder={idPrefix === "client" ? "Иван Иванов" : "Димитър Петров"}
          className={errors.name ? styles.inputError : styles.input}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
        />
        {errors.name && (
          <span
            id={`${idPrefix}-name-error`}
            className={styles.errorMessage}
            role="alert"
          >
            {errors.name}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-email`} className={styles.label}>
          Имейл адрес <span className={styles.required}>*</span>
        </label>
        <input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={data.email}
          onChange={onChange}
          placeholder={
            idPrefix === "client" ? "ivan@example.bg" : "dimitar@example.bg"
          }
          className={errors.email ? styles.inputError : styles.input}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={
            errors.email ? `${idPrefix}-email-error` : undefined
          }
        />
        {errors.email && (
          <span
            id={`${idPrefix}-email-error`}
            className={styles.errorMessage}
            role="alert"
          >
            {errors.email}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-phone`} className={styles.label}>
          Телефонен номер <span className={styles.required}>*</span>
        </label>
        <input
          id={`${idPrefix}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={data.phone}
          onChange={onChange}
          placeholder={idPrefix === "client" ? "0888 123 456" : "0888 765 432"}
          className={errors.phone ? styles.inputError : styles.input}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={
            errors.phone ? `${idPrefix}-phone-error` : undefined
          }
        />
        {errors.phone && (
          <span
            id={`${idPrefix}-phone-error`}
            className={styles.errorMessage}
            role="alert"
          >
            {errors.phone}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-password`} className={styles.label}>
          Парола <span className={styles.required}>*</span>
        </label>
        <div className={styles.passwordWrapper}>
          <input
            id={`${idPrefix}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={data.password}
            onChange={onChange}
            placeholder="Поне 6 символа"
            className={
              errors.password ? styles.passwordInputError : styles.passwordInput
            }
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? `${idPrefix}-password-error` : undefined
            }
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className={styles.passwordToggle}
            aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}
          >
            {showPassword ? "Скрий" : "Покажи"}
          </button>
        </div>
        {errors.password && (
          <span
            id={`${idPrefix}-password-error`}
            className={styles.errorMessage}
            role="alert"
          >
            {errors.password}
          </span>
        )}
      </div>

      <div className={styles.checkboxField}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            id={`${idPrefix}-terms`}
            name="termsAccepted"
            checked={data.termsAccepted}
            onChange={onCheckboxChange}
            className={styles.checkbox}
            aria-invalid={Boolean(errors.termsAccepted)}
            aria-describedby={
              errors.termsAccepted ? `${idPrefix}-terms-error` : undefined
            }
          />
          <span>
            Съгласен съм с{" "}
            <Link href="/terms" className={styles.link}>
              {termsLabel === "client"
                ? "Общите условия"
                : "Общите условия за партньори"}
            </Link>{" "}
            и{" "}
            <Link href="/privacy" className={styles.link}>
              Политиката за поверителност
            </Link>
          </span>
        </label>
        {errors.termsAccepted && (
          <span
            id={`${idPrefix}-terms-error`}
            className={styles.errorMessage}
            role="alert"
          >
            {errors.termsAccepted}
          </span>
        )}
      </div>
    </>
  );
}

export function SignupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerClient, registerSpecialist } = useAuth();

  const initialRoleParam = searchParams.get("role");
  const [role, setRole] = useState<"client" | "specialist">(
    initialRoleParam === "specialist" ? "specialist" : "client",
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
  const handleRoleChange = (newRole: "client" | "specialist") => {
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
      router.push("/");
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
      await registerSpecialist(fullSpecialistInput);
      router.push("/pending-approval");
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
        className={styles.tabs}
        role="tablist"
        aria-label="Избор на тип регистрация"
      >
        <button
          type="button"
          role="tab"
          aria-selected={role === "client"}
          onClick={() => handleRoleChange("client")}
          className={`${styles.tab} ${role === "client" ? styles.tabActive : ""}`}
        >
          Клиент
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === "specialist"}
          onClick={() => handleRoleChange("specialist")}
          className={`${styles.tab} ${role === "specialist" ? styles.tabActive : ""}`}
        >
          Специалист
        </button>
      </div>

      {generalError && (
        <div
          className={styles.alertError}
          role="alert"
          style={{ marginBottom: "18px" }}
        >
          {generalError}
        </div>
      )}

      {/* ===================== CLIENT REGISTRATION ===================== */}
      {role === "client" && (
        <>
          <h1 className={styles.title}>Регистрация на клиент</h1>
          <p className={styles.subtitle}>
            Създайте профил за бързо и лесно управление на вашите домашни
            услуги.
          </p>

          <form
            onSubmit={handleClientSubmit}
            className={styles.form}
            noValidate
          >
            <AccountFields
              idPrefix="client"
              data={step1Data}
              onChange={handleStep1Change}
              onCheckboxChange={handleStep1CheckboxChange}
              errors={clientErrors}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
              termsLabel="client"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? "Регистрация..." : "Създай профил"}
            </button>
          </form>

          <p className={styles.switchPrompt}>
            Вече имате профил?{" "}
            <Link href="/login" className={styles.link}>
              Вход
            </Link>
          </p>

          <div className={styles.specialistSection}>
            <p>
              Вие сте майстор или фирма за услуги?{" "}
              <button
                type="button"
                onClick={() => handleRoleChange("specialist")}
                className={styles.link}
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                Кандидатствайте като специалист
              </button>
            </p>
          </div>
        </>
      )}

      {/* ===================== SPECIALIST ONBOARDING ===================== */}
      {role === "specialist" && (
        <>
          <h1 className={styles.title}>Кандидатствайте като специалист</h1>
          <p className={styles.subtitle}>
            Присъединете се към партньорската мрежа на DOMORA и получавайте
            заявки от проверени клиенти.
          </p>

          {/* Step Indicator */}
          <nav
            aria-label="Стъпки на кандидатстване"
            className={styles.stepIndicator}
          >
            <div className={styles.stepItem}>
              <span
                className={`${styles.stepBadge} ${
                  specialistStep === 1
                    ? styles.stepBadgeActive
                    : styles.stepBadgeCompleted
                }`}
                aria-hidden="true"
              >
                {specialistStep > 1 ? "✓" : "1"}
              </span>
              <span
                className={`${styles.stepTitle} ${
                  specialistStep === 1 ? styles.stepTitleActive : ""
                }`}
                aria-current={specialistStep === 1 ? "step" : undefined}
              >
                Стъпка 1: Данни за профила
              </span>
            </div>
            <div className={styles.stepItem}>
              <span
                className={`${styles.stepBadge} ${
                  specialistStep === 2 ? styles.stepBadgeActive : ""
                }`}
                aria-hidden="true"
              >
                2
              </span>
              <span
                className={`${styles.stepTitle} ${
                  specialistStep === 2 ? styles.stepTitleActive : ""
                }`}
                aria-current={specialistStep === 2 ? "step" : undefined}
              >
                Стъпка 2: Професионална квалификация
              </span>
            </div>
          </nav>

          {/* STEP 1: Personal Details */}
          {specialistStep === 1 && (
            <form className={styles.form} noValidate>
              <AccountFields
                idPrefix="spec"
                data={step1Data}
                onChange={handleStep1Change}
                onCheckboxChange={handleStep1CheckboxChange}
                errors={specialistErrors}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
                termsLabel="specialist"
              />

              <button
                type="button"
                onClick={handleSpecialistStep1Next}
                className={styles.submitButton}
              >
                Продължи към стъпка 2 →
              </button>
            </form>
          )}

          {/* STEP 2: Professional Details */}
          {specialistStep === 2 && (
            <form
              onSubmit={handleSpecialistSubmit}
              className={styles.form}
              noValidate
            >
              <div className={styles.field}>
                <label htmlFor="category" className={styles.label}>
                  Сфера на дейност <span className={styles.required}>*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={step2Data.category}
                  onChange={handleStep2Change}
                  className={
                    specialistErrors.category
                      ? styles.selectError
                      : styles.select
                  }
                  aria-invalid={Boolean(specialistErrors.category)}
                  aria-describedby={
                    specialistErrors.category ? "category-error" : undefined
                  }
                >
                  <option value="">-- Изберете сфера на дейност --</option>
                  {SPECIALIST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {specialistErrors.category && (
                  <span
                    id="category-error"
                    className={styles.errorMessage}
                    role="alert"
                  >
                    {specialistErrors.category}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="area" className={styles.label}>
                  Район на обслужване / Населено място{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="area"
                  name="area"
                  type="text"
                  required
                  value={step2Data.area}
                  onChange={handleStep2Change}
                  placeholder="напр. София и района, Пловдив..."
                  className={
                    specialistErrors.area ? styles.inputError : styles.input
                  }
                  aria-invalid={Boolean(specialistErrors.area)}
                  aria-describedby={
                    specialistErrors.area ? "area-error" : undefined
                  }
                />
                {specialistErrors.area && (
                  <span
                    id="area-error"
                    className={styles.errorMessage}
                    role="alert"
                  >
                    {specialistErrors.area}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="experienceYears" className={styles.label}>
                  Професионален опит (в години){" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min="0"
                  max="60"
                  step="1"
                  required
                  value={step2Data.experienceYears}
                  onChange={handleStep2Change}
                  placeholder="напр. 5"
                  className={
                    specialistErrors.experienceYears
                      ? styles.inputError
                      : styles.input
                  }
                  aria-invalid={Boolean(specialistErrors.experienceYears)}
                  aria-describedby={
                    specialistErrors.experienceYears
                      ? "experience-error"
                      : undefined
                  }
                />
                {specialistErrors.experienceYears && (
                  <span
                    id="experience-error"
                    className={styles.errorMessage}
                    role="alert"
                  >
                    {specialistErrors.experienceYears}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="bio" className={styles.label}>
                  Кратко представяне и извършвани услуги{" "}
                  <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  required
                  value={step2Data.bio}
                  onChange={handleStep2Change}
                  placeholder="Опишете накратко квалификацията си, видовете ремонти/монтажи, с които работите, и оборудването..."
                  className={
                    specialistErrors.bio
                      ? styles.textareaError
                      : styles.textarea
                  }
                  aria-invalid={Boolean(specialistErrors.bio)}
                  aria-describedby={
                    specialistErrors.bio ? "bio-error" : undefined
                  }
                />
                {specialistErrors.bio && (
                  <span
                    id="bio-error"
                    className={styles.errorMessage}
                    role="alert"
                  >
                    {specialistErrors.bio}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="companyName" className={styles.label}>
                  Име на фирма{" "}
                  <span style={{ color: "var(--muted)" }}>
                    (незадължително)
                  </span>
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={step2Data.companyName}
                  onChange={handleStep2Change}
                  placeholder="напр. Ремонти Про ЕООД"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="eik" className={styles.label}>
                  ЕИК / БУЛСТАТ{" "}
                  <span style={{ color: "var(--muted)" }}>
                    (незадължително)
                  </span>
                </label>
                <input
                  id="eik"
                  name="eik"
                  type="text"
                  value={step2Data.eik}
                  onChange={handleStep2Change}
                  placeholder="напр. 204567891"
                  className={
                    specialistErrors.eik ? styles.inputError : styles.input
                  }
                  aria-invalid={Boolean(specialistErrors.eik)}
                  aria-describedby={
                    specialistErrors.eik ? "eik-error" : undefined
                  }
                />
                {specialistErrors.eik && (
                  <span
                    id="eik-error"
                    className={styles.errorMessage}
                    role="alert"
                  >
                    {specialistErrors.eik}
                  </span>
                )}
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setSpecialistStep(1)}
                  className={styles.secondaryButton}
                >
                  ← Назад
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitButton}
                  style={{ marginTop: 0 }}
                >
                  {isSubmitting ? "Изпращане..." : "Изпрати за одобрение"}
                </button>
              </div>
            </form>
          )}

          <p className={styles.switchPrompt}>
            Вече имате профил?{" "}
            <Link href="/login" className={styles.link}>
              Вход
            </Link>
          </p>

          <div className={styles.specialistSection}>
            <p>
              Търсите майстор за дома си?{" "}
              <button
                type="button"
                onClick={() => handleRoleChange("client")}
                className={styles.link}
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                Регистрирайте се като клиент
              </button>
            </p>
          </div>
        </>
      )}
    </>
  );
}
