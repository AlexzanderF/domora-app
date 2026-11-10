"use server";

import { IdentityError, updateClientProfile } from "@/domain/identity";
import type { User } from "@/domain/identity/types";
import { runAction } from "@/lib/server/action";
import { findUserById } from "@/features/auth/server/queries";
import {
  validateEmail,
  validateName,
  validatePhone,
} from "@/features/auth/validation";

export interface ClientProfileInput {
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
}

export interface ClientProfileErrors {
  name?: string;
  email?: string;
  phone?: string;
  propertyAddress?: string;
}

export type ClientProfileActionResult =
  | { success: true; user: User; message: string }
  | {
      success: false;
      error: string;
      fieldErrors?: ClientProfileErrors;
    };

function validateProfile(input: ClientProfileInput): ClientProfileErrors {
  const errors: ClientProfileErrors = {};
  const name = validateName(input.name);
  if (name) errors.name = name;
  const email = validateEmail(input.email);
  if (email) errors.email = email;
  const phone = validatePhone(input.phone);
  if (phone) errors.phone = phone;
  if (input.propertyAddress.trim().length < 8) {
    errors.propertyAddress = "Въведете пълен адрес на имота с поне 8 символа.";
  }
  return errors;
}

export async function updateClientProfileAction(
  input: ClientProfileInput,
): Promise<ClientProfileActionResult> {
  const fieldErrors = validateProfile(input);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: "Моля, проверете въведените данни.",
      fieldErrors,
    };
  }

  const result = await runAction({
    messages: {
      NO_DATABASE: "Профилът е временно недостъпен. Опитайте отново по-късно.",
      UNAUTHENTICATED: "Влезте с клиентски профил, за да редактирате данните.",
      FORBIDDEN: "Влезте с клиентски профил, за да редактирате данните.",
    },
    revalidate: ["profile"],
    run: async (actor) => {
      if (!actor) {
        throw new IdentityError("UNAUTHENTICATED", "Sign in required.");
      }
      await updateClientProfile(actor, actor.id, input);
      return findUserById(actor.id);
    },
  });
  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error ?? "Не успяхме да обновим профила. Опитайте отново.",
    };
  }

  return {
    success: true,
    user: result.data,
    message: "Профилът беше обновен успешно.",
  };
}
