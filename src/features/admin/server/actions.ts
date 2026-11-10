"use server";

import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/db";
import { tariffs } from "@/db/schema";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { getServerSession } from "@/features/auth/server/session";
import { setSpecialistStatus } from "@/domain/identity";
import { runAction } from "@/lib/server/action";
import type { ActionResult } from "@/lib/server/action";
import type { CategoryId, Tariffs } from "@/domain/requests/types";

export type UpdateSpecialistStatusResult = ActionResult;

export interface UpdateTariffsResult {
  success: boolean;
  error?: string;
}

export async function updateSpecialistStatusAction(
  userId: number,
  status: UserStatus,
): Promise<UpdateSpecialistStatusResult> {
  return runAction({
    messages: {
      UNAUTHENTICATED:
        "Неоторизиран достъп. Изискват се администраторски права.",
      FORBIDDEN: "Неоторизиран достъп. Изискват се администраторски права.",
      NOT_FOUND: "Специалистът не е намерен.",
      INVALID_INPUT: "Невалиден статус на специалист.",
    },
    revalidate: ["specialists"],
    run: async (actor) => {
      await setSpecialistStatus(actor, userId, status);
    },
  });
}

export async function updateTariffsAction(
  input: Tariffs,
): Promise<UpdateTariffsResult> {
  if (!isDbConfigured) {
    return { success: false, error: "Няма връзка с базата данни." };
  }

  const currentUser = await getServerSession();
  if (!currentUser || currentUser.role !== UserRole.Admin) {
    return {
      success: false,
      error: "Неоторизиран достъп. Изискват се администраторски права.",
    };
  }

  const db = getDb();
  if (!db) {
    return {
      success: false,
      error: "Грешка при свързване с базата данни.",
    };
  }

  const now = new Date();

  // Upsert categories 0..5
  for (let i = 0; i <= 5; i++) {
    const catId = i as CategoryId;
    const rate = Math.round(input.categories[catId] ?? 30);
    if (rate <= 0) continue;

    await db
      .insert(tariffs)
      .values({
        category: String(i),
        standardRate: rate,
        urgentRate: Math.round(rate * 1.5),
        holidayRate: Math.round(rate * 1.75),
        emergencyRate: Math.round(rate * 2),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tariffs.category,
        set: {
          standardRate: rate,
          urgentRate: Math.round(rate * 1.5),
          holidayRate: Math.round(rate * 1.75),
          emergencyRate: Math.round(rate * 2),
          updatedAt: now,
        },
      });
  }

  // Upsert home plan tariff
  const homeRate = Math.round(input.home * 10);
  await db
    .insert(tariffs)
    .values({
      category: "home",
      standardRate: homeRate,
      urgentRate: Math.round(homeRate * 1.5),
      holidayRate: Math.round(homeRate * 1.75),
      emergencyRate: Math.round(homeRate * 2),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tariffs.category,
      set: {
        standardRate: homeRate,
        urgentRate: Math.round(homeRate * 1.5),
        holidayRate: Math.round(homeRate * 1.75),
        emergencyRate: Math.round(homeRate * 2),
        updatedAt: now,
      },
    });

  // Upsert entry plan tariff
  const entryRate = Math.round(input.entry);
  await db
    .insert(tariffs)
    .values({
      category: "entry",
      standardRate: entryRate,
      urgentRate: Math.round(entryRate * 1.5),
      holidayRate: Math.round(entryRate * 1.75),
      emergencyRate: Math.round(entryRate * 2),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tariffs.category,
      set: {
        standardRate: entryRate,
        urgentRate: Math.round(entryRate * 1.5),
        holidayRate: Math.round(entryRate * 1.75),
        emergencyRate: Math.round(entryRate * 2),
        updatedAt: now,
      },
    });

  revalidatePath("/admin");
  revalidatePath("/plans");
  revalidatePath("/");

  return { success: true };
}
