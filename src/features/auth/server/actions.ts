"use server";

import bcrypt from "bcryptjs";
import { getDb, isDbConfigured } from "@/db";
import { specialistProfiles, users } from "@/db/schema";
import type {
  ClientRegistrationInput,
  SpecialistRegistrationInput,
  User,
} from "../types";
import {
  validateClientRegistration,
  validateLogin,
  validateSpecialistRegistration,
} from "../validation";
import {
  findUserByEmail,
  findUserById,
  findUserByPhone,
  findUserWithPasswordByEmailOrPhone,
} from "./queries";
import { createSession, deleteSession, getServerSession } from "./session";

export type AuthActionResult<T = User> =
  { success: true; user: T } | { success: false; error: string };

export async function loginAction(
  identifier: string,
  password: string,
): Promise<AuthActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return {
      success: false,
      error: "Грешка при свързване с базата данни.",
    };
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
    return {
      success: false,
      error: "Грешка при свързване с базата данни.",
    };
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

export async function registerSpecialistAction(
  input: SpecialistRegistrationInput,
): Promise<AuthActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return {
      success: false,
      error: "Грешка при свързване с базата данни.",
    };
  }

  const validation = validateSpecialistRegistration(input);
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
  const profileId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(input.password, 10);

  await db.insert(users).values({
    id: userId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    passwordHash,
    role: "SPECIALIST",
    status: "PENDING",
  });

  await db.insert(specialistProfiles).values({
    id: profileId,
    userId,
    category: input.category,
    area: input.area,
    experienceYears: input.experienceYears,
    bio: input.bio,
    companyName: input.companyName?.trim() || null,
    eik: input.eik?.trim() || null,
  });

  await createSession(userId);

  const newUser = await findUserById(userId);
  if (!newUser) {
    return {
      success: false,
      error: "Възникна грешка при регистрацията на специалист.",
    };
  }

  return {
    success: true,
    user: newUser,
  };
}

export async function refreshUserAction(): Promise<{
  success: boolean;
  user: User | null;
}> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { success: true, user: null };
  }

  const user = await getServerSession();
  return { success: true, user };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  if (isDbConfigured && process.env.NEXT_STATIC_EXPORT !== "1") {
    await deleteSession();
  }
  return { success: true };
}
