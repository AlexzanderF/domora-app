"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { tariffs, users } from "@/db/schema";
import { getServerSession } from "@/features/auth/server/session";
import type { CategoryId, Tariffs } from "@/features/requests/types";

export interface UpdateSpecialistStatusResult {
  success: boolean;
  error?: string;
  mode?: "db" | "demo";
}

export interface UpdateTariffsResult {
  success: boolean;
  error?: string;
  mode?: "db" | "demo";
}

export async function updateSpecialistStatusAction(
  userId: string,
  status: "ACTIVE" | "REJECTED",
): Promise<UpdateSpecialistStatusResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { success: true, mode: "demo" };
  }

  const currentUser = await getServerSession();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return {
      success: false,
      error: "Неоторизиран достъп. Изискват се администраторски права.",
    };
  }

  if (status !== "ACTIVE" && status !== "REJECTED") {
    return {
      success: false,
      error: "Невалиден статус на специалист.",
    };
  }

  const db = getDb();
  if (!db) {
    return {
      success: false,
      error: "Грешка при свързване с базата данни.",
    };
  }

  await db
    .update(users)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath("/admin/specialists");
  revalidatePath("/pending-approval");
  revalidatePath("/specialist");

  return { success: true, mode: "db" };
}

export async function updateTariffsAction(
  input: Tariffs,
): Promise<UpdateTariffsResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { success: true, mode: "demo" };
  }

  const currentUser = await getServerSession();
  if (!currentUser || currentUser.role !== "ADMIN") {
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
        id: `tariff-${i}`,
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
      id: "tariff-home",
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
      id: "tariff-entry",
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

  return { success: true, mode: "db" };
}
