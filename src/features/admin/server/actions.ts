"use server";

import { revalidatePath } from "next/cache";
import { isDbConfigured } from "@/db";
import { UserStatus } from "@/domain/identity/types";
import { getActor } from "@/features/auth/server/actor";
import { IdentityError, setSpecialistStatus } from "@/domain/identity";
import { PricingError, saveTariffs } from "@/domain/pricing/tariffs";
import type { Tariffs } from "@/domain/requests/types";

export interface UpdateSpecialistStatusResult {
  success: boolean;
  error?: string;
}

export interface UpdateTariffsResult {
  success: boolean;
  error?: string;
}

function specialistStatusError(error: IdentityError): string {
  switch (error.code) {
    case "UNAUTHENTICATED":
    case "FORBIDDEN":
      return "Неоторизиран достъп. Изискват се администраторски права.";
    case "NOT_FOUND":
      return "Специалистът не е намерен.";
    default:
      return "Невалиден статус на специалист.";
  }
}

function tariffsError(error: PricingError): string {
  return error.code === "INVALID_INPUT"
    ? "Невалидни цени. Проверете въведените стойности."
    : "Неоторизиран достъп. Изискват се администраторски права.";
}

export async function updateSpecialistStatusAction(
  userId: number,
  status: UserStatus,
): Promise<UpdateSpecialistStatusResult> {
  if (!isDbConfigured) {
    return { success: false, error: "Няма връзка с базата данни." };
  }

  const actor = await getActor();
  try {
    await setSpecialistStatus(actor, userId, status);
  } catch (error) {
    if (error instanceof IdentityError) {
      return { success: false, error: specialistStatusError(error) };
    }
    throw error;
  }

  revalidatePath("/admin/specialists");
  revalidatePath("/admin");
  revalidatePath("/pending-approval");
  revalidatePath("/specialist");

  return { success: true };
}

export async function updateTariffsAction(
  input: Tariffs,
): Promise<UpdateTariffsResult> {
  if (!isDbConfigured) {
    return { success: false, error: "Няма връзка с базата данни." };
  }

  const actor = await getActor();
  try {
    await saveTariffs(actor, input);
  } catch (error) {
    if (error instanceof PricingError) {
      return { success: false, error: tariffsError(error) };
    }
    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/plans");
  revalidatePath("/");

  return { success: true };
}
