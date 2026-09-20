"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import {
  SPECIALIST_CATEGORIES,
  validateClientRegistration,
  validateSpecialistRegistration,
  type ClientRegistrationErrors,
  type SpecialistRegistrationErrors,
} from "@/features/auth/validation";
import type {
  ClientRegistrationInput,
  SpecialistRegistrationInput,
} from "@/features/auth/types";
import styles from "../auth.module.css";

function SignUpContent() {
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
      // If there are step 1 errors, return user to step 1
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
            <div className={styles.field}>
              <label htmlFor="client-name" className={styles.label}>
                Име и фамилия <span className={styles.required}>*</span>
              </label>
              <input
                id="client-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={step1Data.name}
                onChange={handleStep1Change}
                placeholder="Иван Иванов"
                className={clientErrors.name ? styles.inputError : styles.input}
                aria-invalid={Boolean(clientErrors.name)}
                aria-describedby={
                  clientErrors.name ? "client-name-error" : undefined
                }
              />
              {clientErrors.name && (
                <span
                  id="client-name-error"
                  className={styles.errorMessage}
                  role="alert"
                >
                  {clientErrors.name}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="client-email" className={styles.label}>
                Имейл адрес <span className={styles.required}>*</span>
              </label>
              <input
                id="client-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={step1Data.email}
                onChange={handleStep1Change}
                placeholder="ivan@example.bg"
                className={
                  clientErrors.email ? styles.inputError : styles.input
                }
                aria-invalid={Boolean(clientErrors.email)}
                aria-describedby={
                  clientErrors.email ? "client-email-error" : undefined
                }
              />
              {clientErrors.email && (
                <span
                  id="client-email-error"
                  className={styles.errorMessage}
                  role="alert"
                >
                  {clientErrors.email}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="client-phone" className={styles.label}>
                Телефонен номер <span className={styles.required}>*</span>
              </label>
              <input
                id="client-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={step1Data.phone}
                onChange={handleStep1Change}
                placeholder="0888 123 456"
                className={
                  clientErrors.phone ? styles.inputError : styles.input
                }
                aria-invalid={Boolean(clientErrors.phone)}
                aria-describedby={
                  clientErrors.phone ? "client-phone-error" : undefined
                }
              />
              {clientErrors.phone && (
                <span
                  id="client-phone-error"
                  className={styles.errorMessage}
                  role="alert"
                >
                  {clientErrors.phone}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="client-password" className={styles.label}>
                Парола <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="client-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={step1Data.password}
                  onChange={handleStep1Change}
                  placeholder="Поне 6 символа"
                  className={
                    clientErrors.password
                      ? styles.passwordInputError
                      : styles.passwordInput
                  }
                  aria-invalid={Boolean(clientErrors.password)}
                  aria-describedby={
                    clientErrors.password ? "client-password-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={styles.passwordToggle}
                  aria-label={
                    showPassword ? "Скрий паролата" : "Покажи паролата"
                  }
                >
                  {showPassword ? "Скрий" : "Покажи"}
                </button>
              </div>
              {clientErrors.password && (
                <span
                  id="client-password-error"
                  className={styles.errorMessage}
                  role="alert"
                >
                  {clientErrors.password}
                </span>
              )}
            </div>

            <div className={styles.checkboxField}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  id="client-terms"
                  name="termsAccepted"
                  checked={step1Data.termsAccepted}
                  onChange={handleStep1CheckboxChange}
                  className={styles.checkbox}
                  aria-invalid={Boolean(clientErrors.termsAccepted)}
                  aria-describedby={
                    clientErrors.termsAccepted
                      ? "client-terms-error"
                      : undefined
                  }
                />
                <span>
                  Съгласен съм с{" "}
                  <Link href="/terms" className={styles.link}>
                    Общите условия
                  </Link>{" "}
                  и{" "}
                  <Link href="/privacy" className={styles.link}>
                    Политиката за поверителност
                  </Link>
                </span>
              </label>
              {clientErrors.termsAccepted && (
                <span
                  id="client-terms-error"
                  className={styles.errorMessage}
                  role="alert"
                >
                  {clientErrors.termsAccepted}
                </span>
              )}
            </div>

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
              <div className={styles.field}>
                <label htmlFor="spec-name" className={styles.label}>
                  Име и фамилия <span className={styles.required}>*</span>
                </label>
                <input
                  id="spec-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={step1Data.name}
                  onChange={handleStep1Change}
                  placeholder="Димитър Петров"
                  className={
                    specialistErrors.name ? styles.inputError : styles.input
                  }
                  aria-invalid={Boolean(specialistErrors.name)}
                  aria-describedby={
                    specialistErrors.name ? "spec-name-error" : undefined
                  }
                />
                {specialistErrors.name && (
                  <span
                    id="spec-name-error"
                    className={styles.errorMessage}
                    role="alert"
                  >
                    {specialistErrors.name}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="spec-email" className={styles.label}>
                  Имейл адрес <span className={styles.required}>*</span>
                </label>
                <input
                  id="spec-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={step1Data.email}
                  onChange={handleStep1Change}
                  placeholder="dimitar@example.bg"
                  className={
                    specialistErrors.email ? styles.inputError : styles.input
                  }
                  aria-invalid={Boolean(specialistErrors.email)}
                  aria-describedby={
                    specialistErrors.email ? "spec-email-error" : undefined
                  }
                />
                {specialistErrors.email && (
                  <span
                    id="spec-email-error"
                    className={styles.errorMessage}
                    role="alert"
                  >
                    {specialistErrors.email}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="spec-phone" className={styles.label}>
                  Телефонен номер <span className={styles.required}>*</span>
                </label>
                <input
                  id="spec-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={step1Data.phone}
                  onChange={handleStep1Change}
                  placeholder="0888 765 432"
                  className={
                    specialistErrors.phone ? styles.inputError : styles.input
                  }
                  aria-invalid={Boolean(specialistErrors.phone)}
                  aria-describedby={
                    specialistErrors.phone ? "spec-phone-error" : undefined
                  }
                />
                {specialistErrors.phone && (
                  <span
                    id="spec-phone-error"
                    className={styles.errorMessage}
                    role="alert"
                  >
                    {specialistErrors.phone}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="spec-password" className={styles.label}>
                  Парола <span className={styles.required}>*</span>
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="spec-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={step1Data.password}
                    onChange={handleStep1Change}
                    placeholder="Поне 6 символа"
                    className={
                      specialistErrors.password
                        ? styles.passwordInputError
                        : styles.passwordInput
                    }
                    aria-invalid={Boolean(specialistErrors.password)}
                    aria-describedby={
                      specialistErrors.password
                        ? "spec-password-error"
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={styles.passwordToggle}
                    aria-label={
                      showPassword ? "Скрий паролата" : "Покажи паролата"
                    }
                  >
                    {showPassword ? "Скрий" : "Покажи"}
                  </button>
                </div>
                {specialistErrors.password && (
                  <span
                    id="spec-password-error"
                    className={styles.errorMessage}
                    role="alert"
                  >
                    {specialistErrors.password}
                  </span>
                )}
              </div>

              <div className={styles.checkboxField}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    id="spec-terms"
                    name="termsAccepted"
                    checked={step1Data.termsAccepted}
                    onChange={handleStep1CheckboxChange}
                    className={styles.checkbox}
                    aria-invalid={Boolean(specialistErrors.termsAccepted)}
                    aria-describedby={
                      specialistErrors.termsAccepted
                        ? "spec-terms-error"
                        : undefined
                    }
                  />
                  <span>
                    Съгласен съм с{" "}
                    <Link href="/terms" className={styles.link}>
                      Общите условия за партньори
                    </Link>{" "}
                    и{" "}
                    <Link href="/privacy" className={styles.link}>
                      Политиката за поверителност
                    </Link>
                  </span>
                </label>
                {specialistErrors.termsAccepted && (
                  <span
                    id="spec-terms-error"
                    className={styles.errorMessage}
                    role="alert"
                  >
                    {specialistErrors.termsAccepted}
                  </span>
                )}
              </div>

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

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "40px" }}>Зареждане...</div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
