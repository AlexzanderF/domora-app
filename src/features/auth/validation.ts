import type { ClientRegistrationInput } from "./types";

export interface ClientRegistrationErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  termsAccepted?: string;
}

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

export interface LoginErrors {
  identifier?: string;
  password?: string;
}

/**
 * Validates login input: identifier and password must not be empty.
 */
export function validateLogin(
  identifier: string,
  password: string,
): {
  isValid: boolean;
  errors: LoginErrors;
} {
  const errors: LoginErrors = {};
  if (!identifier.trim()) {
    errors.identifier = "Моля, въведете имейл или телефон.";
  }
  if (!password) {
    errors.password = "Моля, въведете парола.";
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
