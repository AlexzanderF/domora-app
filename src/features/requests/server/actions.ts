"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { requests, users } from "@/db/schema";
import { getServerSession } from "@/features/auth/server/session";
import type {
  CategoryId,
  Plan,
  RequestAction,
  RequestStatus,
  ServiceRequest,
} from "../types";

export interface CreateServiceRequestInput {
  category: CategoryId;
  service: string;
  address: string;
  description: string;
  date?: string;
  time?: string;
  price: number;
  plan?: Plan;
  priority?: "STANDARD" | "URGENT" | "EMERGENCY";
}

export interface ServiceRequestActionResult {
  success: boolean;
  error?: string;
  mode?: "db" | "demo";
  request?: ServiceRequest;
}

function revalidateWorkspaceRequests(): void {
  revalidatePath("/requests");
  revalidatePath("/client/requests");
  revalidatePath("/client");
  revalidatePath("/specialist");
  revalidatePath("/admin");
}

export async function createServiceRequestAction(
  input: CreateServiceRequestInput,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { success: true, mode: "demo" };
  }

  const user = await getServerSession();
  if (!user) {
    return { success: true, mode: "demo" };
  }

  const address = input.address.trim();
  const description = input.description.trim();
  const service = input.service.trim();

  if (!address || description.length < 5 || !service) {
    return {
      success: false,
      error:
        "Моля, въведете коректен адрес, услуга и описание с поне 5 символа.",
    };
  }

  if (typeof input.price !== "number" || input.price <= 0) {
    return {
      success: false,
      error: "Невалидна цена за избраната услуга.",
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

  const [inserted] = await db
    .insert(requests)
    .values({
      clientId: user.id,
      specialistId: null,
      title: service,
      description,
      category: String(input.category),
      address,
      priority: input.priority ?? "STANDARD",
      status: 0,
      price: Math.round(input.price),
      clientPhone: user.phone || "0888000000",
    })
    .returning({ id: requests.id });

  const requestId = inserted.id;

  revalidateWorkspaceRequests();

  const createdRequest: ServiceRequest = {
    id: requestId,
    category: input.category,
    service,
    address,
    date: input.date || now.toISOString().split("T")[0],
    time:
      input.time ||
      now.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" }),
    price: Math.round(input.price),
    status: 0 as RequestStatus,
    description,
    plan: input.plan,
  };

  return {
    success: true,
    mode: "db",
    request: createdRequest,
  };
}

export async function assignSpecialistAction(
  requestId: number,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { success: true, mode: "demo" };
  }

  const user = await getServerSession();
  if (!user || (user.role !== "SPECIALIST" && user.role !== "ADMIN")) {
    return {
      success: false,
      error: "Само специалист или администратор може да приема заявки.",
    };
  }

  if (user.role === "SPECIALIST" && user.status !== "ACTIVE") {
    return {
      success: false,
      error: "Профилът ви все още не е одобрен.",
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
    .update(requests)
    .set({
      specialistId: user.id,
      status: 1,
      updatedAt: new Date(),
    })
    .where(and(eq(requests.id, requestId), eq(requests.status, 0)));

  revalidatePath("/specialist");
  revalidatePath("/requests");
  revalidatePath("/client/requests");
  revalidatePath("/client");
  revalidatePath("/admin");

  return { success: true, mode: "db" };
}

export async function startWorkAction(
  requestId: number,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { success: true, mode: "demo" };
  }

  const user = await getServerSession();
  if (!user) {
    return { success: false, error: "Неоторизиран достъп." };
  }

  const db = getDb();
  if (!db) {
    return { success: false, error: "Грешка при свързване с базата данни." };
  }

  const [existing] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));
  if (!existing) {
    return { success: false, error: "Заявката не е намерена." };
  }

  const currentStatus = existing.status;
  // 2-step execution: skip the intermediate status 2 and go straight to
  // "В процес" (3) once the specialist starts work.
  const nextStatus =
    currentStatus === 0
      ? 1
      : currentStatus === 1 || currentStatus === 2
        ? 3
        : currentStatus;

  await db
    .update(requests)
    .set({
      status: nextStatus,
      ...(currentStatus === 0 && !existing.specialistId
        ? { specialistId: user.id }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  revalidatePath("/specialist");
  revalidatePath("/requests");
  revalidatePath("/client/requests");
  revalidatePath("/client");
  revalidatePath("/admin");

  return { success: true, mode: "db" };
}

export async function completeWorkAction(
  requestId: number,
  report?: string,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { success: true, mode: "demo" };
  }

  const user = await getServerSession();
  if (!user) {
    return { success: false, error: "Неоторизиран достъп." };
  }

  const db = getDb();
  if (!db) {
    return { success: false, error: "Грешка при свързване с базата данни." };
  }

  const [existing] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));
  if (!existing) {
    return { success: false, error: "Заявката не е намерена." };
  }

  let nextStatus = existing.status;
  let nextDescription = existing.description;

  if (existing.status === 3) {
    nextStatus = 4;
    if (report?.trim()) {
      nextDescription = `${existing.description}\n[ОТЧЕТ] ${report.trim()}`;
    }
  } else if (existing.status === 4) {
    nextStatus = 5;
  }

  await db
    .update(requests)
    .set({
      status: nextStatus,
      description: nextDescription,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  revalidatePath("/specialist");
  revalidatePath("/requests");
  revalidatePath("/client/requests");
  revalidatePath("/client");
  revalidatePath("/admin");

  return { success: true, mode: "db" };
}

export async function cancelRequestAction(
  requestId: number,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { success: true, mode: "demo" };
  }

  const user = await getServerSession();
  if (!user) {
    return { success: false, error: "Неоторизиран достъп." };
  }

  const db = getDb();
  if (!db) {
    return { success: false, error: "Грешка при свързване с базата данни." };
  }

  const [existing] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));
  if (!existing) {
    return { success: false, error: "Заявката не е намерена." };
  }

  if (user.role === "SPECIALIST" && existing.status <= 1) {
    await db
      .update(requests)
      .set({
        specialistId: null,
        status: 0,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, requestId));
  } else {
    const updatedDesc = existing.description.startsWith("[ОТКАЗАНА]")
      ? existing.description
      : `[ОТКАЗАНА] ${existing.description}`;

    await db
      .update(requests)
      .set({
        description: updatedDesc,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, requestId));
  }

  revalidatePath("/specialist");
  revalidatePath("/requests");
  revalidatePath("/client/requests");
  revalidatePath("/client");
  revalidatePath("/admin");

  return { success: true, mode: "db" };
}

export async function transitionRequestServerAction(
  requestId: number,
  action: RequestAction,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return { success: true, mode: "demo" };
  }

  switch (action.type) {
    case "advance": {
      const db = getDb();
      if (!db) return { success: false, error: "Няма връзка с базата данни." };
      const [req] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, requestId));
      if (!req) return { success: false, error: "Заявката не е намерена." };

      if (req.status === 0) {
        return assignSpecialistAction(requestId);
      }
      if (req.status === 3) {
        return completeWorkAction(requestId, action.report);
      }
      return startWorkAction(requestId);
    }
    case "complete":
      return completeWorkAction(requestId);
    case "cancel":
    case "decline":
      return cancelRequestAction(requestId);
    case "rate": {
      const db = getDb();
      if (!db) return { success: false, error: "Няма връзка с базата данни." };
      const [req] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, requestId));
      if (!req) return { success: false, error: "Заявката не е намерена." };

      await db
        .update(requests)
        .set({
          description: `${req.description}\n[ОЦЕНКА: ${action.rating}/5]`,
          updatedAt: new Date(),
        })
        .where(eq(requests.id, requestId));

      revalidateWorkspaceRequests();
      return { success: true, mode: "db" };
    }
    case "issue": {
      const db = getDb();
      if (!db) return { success: false, error: "Няма връзка с базата данни." };
      const [req] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, requestId));
      if (!req) return { success: false, error: "Заявката не е намерена." };

      await db
        .update(requests)
        .set({
          description: `${req.description}\n[СИГНАЛ] Подаден сигнал от клиент`,
          updatedAt: new Date(),
        })
        .where(eq(requests.id, requestId));

      revalidateWorkspaceRequests();
      return { success: true, mode: "db" };
    }
    case "resolve": {
      const db = getDb();
      if (!db) return { success: false, error: "Няма връзка с базата данни." };
      const [req] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, requestId));
      if (!req) return { success: false, error: "Заявката не е намерена." };

      const cleanedDescription = req.description
        .replace(/\n?\[СИГНАЛ\][^\n]*/g, "")
        .trim();

      await db
        .update(requests)
        .set({
          description: cleanedDescription,
          updatedAt: new Date(),
        })
        .where(eq(requests.id, requestId));

      revalidateWorkspaceRequests();
      return { success: true, mode: "db" };
    }
    default:
      return { success: true, mode: "db" };
  }
}

function stripRecommendMarkers(description: string): string {
  return description.replace(/\n?\[ПРЕПОРЪЧАНА:\s*\d+\]/g, "").trim();
}

async function findDispatchCandidate(
  requestId: number,
  specialistId: number,
): Promise<{ ok: true; description: string } | { ok: false; error: string }> {
  const currentUser = await getServerSession();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return {
      ok: false,
      error: "Неоторизиран достъп. Изискват се администраторски права.",
    };
  }

  const db = getDb();
  if (!db) {
    return { ok: false, error: "Няма връзка с базата данни." };
  }

  const [req] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));
  if (!req) {
    return { ok: false, error: "Заявката не е намерена." };
  }
  if (req.status !== 0 || req.specialistId !== null) {
    return { ok: false, error: "Заявката вече е разпределена." };
  }

  const [specialist] = await db
    .select()
    .from(users)
    .where(eq(users.id, specialistId));
  if (
    !specialist ||
    specialist.role !== "SPECIALIST" ||
    specialist.status !== "ACTIVE"
  ) {
    return {
      ok: false,
      error: "Избраният специалист не е активен.",
    };
  }

  return { ok: true, description: req.description };
}

export async function adminAssignSpecialistAction(
  requestId: number,
  specialistId: number,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return {
      success: false,
      error: "Административният панел изисква база данни.",
    };
  }

  const candidate = await findDispatchCandidate(requestId, specialistId);
  if (!candidate.ok) {
    return { success: false, error: candidate.error };
  }

  const db = getDb();
  if (!db) {
    return { success: false, error: "Няма връзка с базата данни." };
  }

  await db
    .update(requests)
    .set({
      specialistId,
      status: 1,
      description: `${stripRecommendMarkers(candidate.description)}\n[ДИСПЕЧЕР] Разпределена от администратор`,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  revalidateWorkspaceRequests();
  revalidatePath("/specialist/opportunities");
  return { success: true, mode: "db" };
}

export async function adminRecommendSpecialistAction(
  requestId: number,
  specialistId: number,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured || process.env.NEXT_STATIC_EXPORT === "1") {
    return {
      success: false,
      error: "Административният панел изисква база данни.",
    };
  }

  const candidate = await findDispatchCandidate(requestId, specialistId);
  if (!candidate.ok) {
    return { success: false, error: candidate.error };
  }

  const db = getDb();
  if (!db) {
    return { success: false, error: "Няма връзка с базата данни." };
  }

  await db
    .update(requests)
    .set({
      description: `${stripRecommendMarkers(candidate.description)}\n[ПРЕПОРЪЧАНА: ${specialistId}]`,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  revalidateWorkspaceRequests();
  revalidatePath("/specialist/opportunities");
  return { success: true, mode: "db" };
}
