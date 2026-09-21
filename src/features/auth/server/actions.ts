"use server";

import bcrypt from "bcryptjs";
import { getDb, isDbConfigured } from "@/db";
import { users } from "@/db/schema";
import type { ClientRegistrationInput, User } from "../types";
import { validateClientRegistration, validateLogin } from "../validation";
import {
  findUserByEmail,
  findUserById,
  findUserByPhone,
  findUserWithPasswordByEmailOrPhone,
} from "./queries";
import { createSession, deleteSession } from "./session";

export type AuthActionResult<T = User> =
  | { success: true; user: T; mode?: "db" }
  | { success: false; error: string; mode?: "db" }
  | { mode: "demo" };

export async function loginAction(
  identifier: string,
  password: string,
): Promise<AuthActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { mode: "demo" };
  }

  const validation = validateLogin(identifier, password);
  if (!validation.isValid) {
    return {
      success: false,
      error: "Моля, попълнете всички задължителни полета коректно.",
    };
  }

  const userWithPassword = await findUserWithPasswordByEmailOrPhone(identifier);
  if (!userWithPassword) {
    return {
      success: false,
      error: "Невалиден имейл/телефон или парола.",
    };
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    userWithPassword.passwordHash,
  );
  if (!isPasswordValid) {
    return {
      success: false,
      error: "Невалиден имейл/телефон или парола.",
    };
  }

  if (
    userWithPassword.role === "SPECIALIST" &&
    userWithPassword.status === "REJECTED"
  ) {
    return {
      success: false,
      error:
        "Кандидатурата ви като специалист е отказана. За повече информация се свържете с екипа на DOMORA.",
    };
  }

  await createSession(userWithPassword.id);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...domainUser } = userWithPassword;
  return {
    success: true,
    user: domainUser,
  };
}

export async function registerClientAction(
  input: ClientRegistrationInput,
): Promise<AuthActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { mode: "demo" };
  }

  const validation = validateClientRegistration(input);
  if (!validation.isValid) {
    return {
      success: false,
      error: "Моля, проверете въведените данни за грешки.",
    };
  }

  const existingEmail = await findUserByEmail(input.email);
  if (existingEmail) {
    return {
      success: false,
      error: "Вече съществува потребител с този имейл адрес.",
    };
  }

  const existingPhone = await findUserByPhone(input.phone);
  if (existingPhone) {
    return {
      success: false,
      error: "Вече съществува потребител с този телефонен номер.",
    };
  }

  const db = getDb();
  if (!db) {
    return {
      success: false,
      error: "Грешка при свързване с базата данни.",
    };
  }

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(input.password, 10);

  await db.insert(users).values({
    id: userId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    passwordHash,
    role: "CLIENT",
    status: "ACTIVE",
  });

  await createSession(userId);

  const newUser = await findUserById(userId);
  if (!newUser) {
    return {
      success: false,
      error: "Възникна грешка при създаването на потребителя.",
    };
  }

  return {
    success: true,
    user: newUser,
  };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  if (isDbConfigured && process.env.NEXT_STATIC_EXPORT !== "1") {
    await deleteSession();
  }
  return { success: true };
}
