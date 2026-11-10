"use server";

import bcrypt from "bcryptjs";
import { isDbConfigured } from "@/db";
import {
  IdentityError,
  authenticate,
  isPasswordResetTokenValid,
  registerClient,
  registerSpecialist,
  requestPasswordReset,
  resetPassword,
} from "@/domain/identity";
import type {
  ClientRegistrationInput,
  SpecialistRegistrationInput,
  User,
} from "@/domain/identity/types";
import { runAction } from "@/lib/server/action";
import type { ActionResult } from "@/lib/server/action";
import {
  validateClientRegistration,
  validateEmail,
  validateLogin,
  validatePassword,
  validateSpecialistRegistration,
} from "../validation";
import { findUserByEmail, findUserById, findUserByPhone } from "./queries";
import { createSession, deleteSession, getServerSession } from "./session";

export type AuthActionResult = ActionResult<User>;

const REGISTRATION_INVALID = "Моля, проверете въведените данни за грешки.";

// Signs the user in and returns them, for every action that ends in a session.
async function startSession(userId: number): Promise<User> {
  await createSession(userId);
  const user = await findUserById(userId);
  if (!user) throw new Error(`User ${userId} vanished after sign-in`);
  return user;
}

export async function loginAction(
  identifier: string,
  password: string,
): Promise<AuthActionResult> {
  if (!validateLogin(identifier, password).isValid) {
    return {
      success: false,
      error: "Моля, попълнете всички задължителни полета коректно.",
    };
  }
  return runAction({
    run: async () => startSession(await authenticate(identifier, password)),
  });
}

export async function registerClientAction(
  input: ClientRegistrationInput,
): Promise<AuthActionResult> {
  if (!validateClientRegistration(input).isValid) {
    return { success: false, error: REGISTRATION_INVALID };
  }
  return runAction({
    run: async () => startSession(await registerClient(input)),
  });
}

export async function registerSpecialistAction(
  input: SpecialistRegistrationInput,
): Promise<AuthActionResult> {
  if (!validateSpecialistRegistration(input).isValid) {
    return { success: false, error: REGISTRATION_INVALID };
  }
  return runAction({
    run: async () => {
      if (await findUserByEmail(input.email)) {
        throw new IdentityError("EMAIL_TAKEN", "Email is already registered.");
      }
      if (await findUserByPhone(input.phone)) {
        throw new IdentityError("PHONE_TAKEN", "Phone is already registered.");
      }
      const userId = await registerSpecialist({
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: await bcrypt.hash(input.password, 10),
        profile: {
          category: input.category,
          area: input.area,
          experienceYears: input.experienceYears,
          bio: input.bio,
          companyName: input.companyName,
          eik: input.eik,
        },
      });
      return startSession(userId);
    },
  });
}

export async function refreshUserAction(): Promise<{
  success: boolean;
  user: User | null;
}> {
  if (!isDbConfigured) {
    return { success: true, user: null };
  }

  const user = await getServerSession();
  return { success: true, user };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  if (isDbConfigured) {
    await deleteSession();
  }
  return { success: true };
}

// Succeeds whether or not the email has an account, so the form cannot be
// used to find out which emails are registered.
export async function requestPasswordResetAction(
  email: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const validationError = validateEmail(email);
  if (validationError) {
    return { success: false, error: validationError };
  }
  if (!isDbConfigured) {
    return { success: false, error: "Грешка при свързване с базата данни." };
  }

  await requestPasswordReset(email);
  return { success: true };
}

export async function resetPasswordAction(
  token: string,
  password: string,
): Promise<
  { success: true } | { success: false; error: string; invalidLink?: true }
> {
  const validationError = validatePassword(password);
  if (validationError) {
    return { success: false, error: validationError };
  }
  if (!isDbConfigured) {
    return { success: false, error: "Грешка при свързване с базата данни." };
  }

  const invalidLink = {
    success: false,
    error: "Връзката е невалидна или е изтекла.",
    invalidLink: true,
  } as const;
  // Checked first so a made-up token never costs a password hash.
  if (!(await isPasswordResetTokenValid(token))) {
    return invalidLink;
  }
  try {
    await resetPassword(token, await bcrypt.hash(password, 10));
  } catch (error) {
    if (error instanceof IdentityError && error.code === "INVALID_TOKEN") {
      return invalidLink;
    }
    throw error;
  }
  return { success: true };
}
