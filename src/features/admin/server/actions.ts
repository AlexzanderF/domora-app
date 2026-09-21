"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { users } from "@/db/schema";
import { getServerSession } from "@/features/auth/server/session";

export interface UpdateSpecialistStatusResult {
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
