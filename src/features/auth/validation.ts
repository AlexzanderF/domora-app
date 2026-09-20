import type {
  ClientRegistrationInput,
  SpecialistRegistrationInput,
} from "./types";

export interface ClientRegistrationErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  termsAccepted?: string;
}

export const SPECIALIST_CATEGORIES = [
  "ВиК",
  "Електро",
  "Климатици",
  "Ремонти и монтажи",
  "Почистване",
  "Друго",
] as const;

export type SpecialistCategory = (typeof SPECIALIST_CATEGORIES)[number];

export interface SpecialistStep2Input {
  category: string;
  area: string;
  experienceYears: number | string;
  bio: string;
  companyName?: string;
  eik?: string;
}

export interface SpecialistStep2Errors {
  category?: string;
  area?: string;
  experienceYears?: string;
  bio?: string;
  companyName?: string;
  eik?: string;
}

export interface SpecialistRegistrationErrors
  extends ClientRegistrationErrors, SpecialistStep2Errors {}

/**
 * Validates Bulgarian full name: required, at least 2 characters.
 */
export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Името е задължително.";
  }
  if (trimmed.length < 2) {
    return "Името трябва да съдържа поне 2 символа.";
  }
  return null;
}

/**
 * Validates email format.
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return "Имейл адресът е задължителен.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return "Моля, въведете валиден имейл адрес.";
  }
  return null;
}

/**
 * Validates Bulgarian phone format (e.g. starts with +359 or 0, at least 8 digits).
 */
export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return "Телефонният номер е задължителен.";
  }
  const normalized = trimmed.replace(/[\s\-().]/g, "");
  const digitsOnly = trimmed.replace(/\D/g, "");

  // Bulgarian phone numbers start with 0 (e.g., 0888123456) or +359 / 00359
  const bgPattern = /^(?:\+359|00359|0)\d{7,11}$/;
  if (!bgPattern.test(normalized) || digitsOnly.length < 8) {
    return "Моля, въведете валиден български телефонен номер (напр. 0888 123 456 или +359 888 123 456).";
  }
  return null;
}

/**
 * Validates password: required, at least 6 characters.
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return "Паролата е задължителна.";
  }
  if (password.length < 6) {
    return "Паролата трябва да бъде поне 6 символа.";
  }
  return null;
}

/**
 * Validates terms acceptance: must be true.
 */
export function validateTerms(termsAccepted: boolean): string | null {
  if (!termsAccepted) {
    return "Трябва да приемете общите условия, за да продължите.";
  }
  return null;
}

/**
 * Validates the entire client registration input.
 */
export function validateClientRegistration(input: ClientRegistrationInput): {
  isValid: boolean;
  errors: ClientRegistrationErrors;
} {
  const errors: ClientRegistrationErrors = {};

  const nameError = validateName(input.name);
  if (nameError) {
    errors.name = nameError;
  }

  const emailError = validateEmail(input.email);
  if (emailError) {
    errors.email = emailError;
  }

  const phoneError = validatePhone(input.phone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  const passwordError = validatePassword(input.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  const termsError = validateTerms(input.termsAccepted);
  if (termsError) {
    errors.termsAccepted = termsError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates craft category: required.
 */
export function validateCategory(category: string): string | null {
  if (!category || !category.trim()) {
    return "Моля, изберете сфера на дейност.";
  }
  return null;
}

/**
 * Validates operating area / city: required, at least 2 chars.
 */
export function validateArea(area: string): string | null {
  const trimmed = area.trim();
  if (!trimmed) {
    return "Населеното място / районът е задължителен.";
  }
  if (trimmed.length < 2) {
    return "Районът трябва да бъде поне 2 символа.";
  }
  return null;
}

/**
 * Validates professional experience in years: required, non-negative number.
 */
export function validateExperienceYears(
  years: number | string | undefined | null,
): string | null {
  if (years === "" || years === null || years === undefined) {
    return "Моля, посочете професионален опит в години.";
  }
  const num = typeof years === "number" ? years : Number(years);
  if (Number.isNaN(num) || num < 0) {
    return "Опитът трябва да бъде положително число или 0.";
  }
  if (num > 70) {
    return "Моля, въведете реалистичен брой години опит.";
  }
  return null;
}

/**
 * Validates bio / description: required, at least 10 chars.
 */
export function validateBio(bio: string): string | null {
  const trimmed = bio.trim();
  if (!trimmed) {
    return "Краткото описание е задължително.";
  }
  if (trimmed.length < 10) {
    return "Моля, въведете поне 10 символа кратко описание.";
  }
  return null;
}

/**
 * Validates optional EIK / BULSTAT: if provided, must be 9 or 13 digits.
 */
export function validateEik(eik?: string): string | null {
  if (!eik || !eik.trim()) {
    return null;
  }
  const trimmed = eik.trim();
  if (!/^\d{9}(\d{4})?$/.test(trimmed)) {
    return "ЕИК / БУЛСТАТ трябва да съдържа 9 или 13 цифри.";
  }
  return null;
}

/**
 * Validates Step 2 fields for specialist onboarding.
 */
export function validateSpecialistStep2(input: SpecialistStep2Input): {
  isValid: boolean;
  errors: SpecialistStep2Errors;
} {
  const errors: SpecialistStep2Errors = {};

  const categoryError = validateCategory(input.category);
  if (categoryError) {
    errors.category = categoryError;
  }

  const areaError = validateArea(input.area);
  if (areaError) {
    errors.area = areaError;
  }

  const experienceYearsError = validateExperienceYears(input.experienceYears);
  if (experienceYearsError) {
    errors.experienceYears = experienceYearsError;
  }

  const bioError = validateBio(input.bio);
  if (bioError) {
    errors.bio = bioError;
  }

  const eikError = validateEik(input.eik);
  if (eikError) {
    errors.eik = eikError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates the entire specialist registration input (Step 1 + Step 2).
 */
export function validateSpecialistRegistration(
  input: SpecialistRegistrationInput,
): {
  isValid: boolean;
  errors: SpecialistRegistrationErrors;
} {
  const step1Validation = validateClientRegistration({
    name: input.name,
    email: input.email,
    phone: input.phone,
    password: input.password,
    termsAccepted: input.termsAccepted,
  });

  const step2Validation = validateSpecialistStep2({
    category: input.category,
    area: input.area,
    experienceYears: input.experienceYears,
    bio: input.bio,
    companyName: input.companyName,
    eik: input.eik,
  });

  const errors: SpecialistRegistrationErrors = {
    ...step1Validation.errors,
    ...step2Validation.errors,
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
