"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/db";
import { users } from "@/db/schema";
import {
  validateEmail,
  validateName,
  validatePhone,
} from "@/features/auth/validation";
import {
  findUserByEmail,
  findUserByPhone,
} from "@/features/auth/server/queries";
import { getServerSession } from "@/features/auth/server/session";
import { UserRole } from "@/features/auth/types";
import type { User } from "@/features/auth/types";

export interface ClientProfileInput {
  name: string;
  email: string;
  phone: string;
}

export interface ClientProfileErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export type ClientProfileActionResult =
  | { success: true; user: User; message: string }
  | {
      success: false;
      error: string;
      fieldErrors?: ClientProfileErrors;
    };

export async function updateClientProfileAction(
  input: ClientProfileInput,
): Promise<ClientProfileActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return {
      success: false,
      error: "Профилът е временно недостъпен. Опитайте отново по-късно.",
    };
  }

  const currentUser = await getServerSession();
  if (!currentUser || currentUser.role !== UserRole.Client) {
    return {
      success: false,
      error: "Влезте с клиентски профил, за да редактирате данните.",
    };
  }

  const nextName = input.name.trim();
  const nextEmail = input.email.trim().toLowerCase();
  const nextPhone = input.phone.trim();
  const fieldErrors: ClientProfileErrors = {};

  const nameError = validateName(nextName);
  if (nameError) fieldErrors.name = nameError;

  const emailError = validateEmail(nextEmail);
  if (emailError) fieldErrors.email = emailError;

  const phoneError = validatePhone(nextPhone);
  if (phoneError) fieldErrors.phone = phoneError;

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: "Моля, проверете въведените данни.",
      fieldErrors,
    };
  }

  const existingEmail = await findUserByEmail(nextEmail);
  if (existingEmail && existingEmail.id !== currentUser.id) {
    fieldErrors.email = "Вече съществува потребител с този имейл адрес.";
  }

  const existingPhone = await findUserByPhone(nextPhone);
  if (existingPhone && existingPhone.id !== currentUser.id) {
    fieldErrors.phone = "Вече съществува потребител с този телефонен номер.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: "Моля, проверете въведените данни.",
      fieldErrors,
    };
  }

  const db = getDb();
  if (!db) {
    return {
      success: false,
      error: "Грешка при свързване с базата данни.",
    };
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      name: nextName,
      email: nextEmail,
      phone: nextPhone,
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id))
    .returning();

  if (!updatedUser) {
    return {
      success: false,
      error: "Не успяхме да обновим профила. Опитайте отново.",
    };
  }

  const user: User = {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    role: updatedUser.role,
    status: updatedUser.status,
    createdAt: updatedUser.createdAt.toISOString(),
    updatedAt: updatedUser.updatedAt.toISOString(),
  };

  revalidatePath("/client/profile");

  return {
    success: true,
    user,
    message: "Профилът беше обновен успешно.",
  };
}
