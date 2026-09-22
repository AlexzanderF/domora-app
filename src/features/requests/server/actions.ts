"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { requests, users } from "@/db/schema";
import { getServerSession } from "@/features/auth/server/session";
import {
  canClaim,
  canConfirmCompletion,
  canFlagIssue,
  canRate,
  canResolveIssue,
  isValidRating,
  nextExecutionStep,
  requiresCompletionReport,
} from "../request-rules";
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

  const [existing] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));
  if (
    !existing ||
    !canClaim({
      status: existing.status as RequestStatus,
      cancelled: existing.cancelled,
      specialistId: existing.specialistId,
    })
  ) {
    return { success: false, error: "Заявката вече е разпределена." };
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
  if (existing.cancelled) {
    return { success: false, error: "Заявката е отказана." };
  }

  const currentStatus = existing.status;
  // 2-step execution: unassigned work is claimed, then the intermediate
  // status 2 is skipped straight to "В процес" (3) once work starts.
  const nextStatus =
    currentStatus === 0 || currentStatus === 1 || currentStatus === 2
      ? nextExecutionStep(currentStatus as RequestStatus)
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
  if (existing.cancelled) {
    return { success: false, error: "Заявката е отказана." };
  }

  const status = existing.status as RequestStatus;
  let nextStatus = existing.status;
  let nextReport: string | undefined;

  if (requiresCompletionReport(status)) {
    if (!report?.trim()) {
      return {
        success: false,
        error: "Отчетът е задължителен, за да завършите задачата.",
      };
    }
    nextStatus = 4;
    nextReport = report.trim();
  } else if (canConfirmCompletion({ status, cancelled: existing.cancelled })) {
    nextStatus = 5;
  } else {
    return {
      success: false,
      error: "Задачата не е в етап, който може да бъде завършен.",
    };
  }

  await db
    .update(requests)
    .set({
      status: nextStatus,
      ...(nextReport !== undefined ? { report: nextReport } : {}),
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
    await db
      .update(requests)
      .set({
        cancelled: true,
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
      if (!isValidRating(action.rating)) {
        return {
          success: false,
          error: "Оценката трябва да е цяло число от 1 до 5.",
        };
      }
      if (
        !canRate(
          {
            status: req.status as RequestStatus,
            cancelled: req.cancelled,
            rating: req.rating,
          },
          action.rating,
        )
      ) {
        return {
          success: false,
          error: "Тази заявка не може да бъде оценена.",
        };
      }

      await db
        .update(requests)
        .set({
          rating: action.rating,
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
      if (req.issue) {
        revalidateWorkspaceRequests();
        return { success: true, mode: "db" };
      }
      if (
        !canFlagIssue({
          status: req.status as RequestStatus,
          cancelled: req.cancelled,
          issue: req.issue,
        })
      ) {
        return {
          success: false,
          error:
            "Сигнал за проблем може да се подаде след приключване на работата.",
        };
      }

      await db
        .update(requests)
        .set({
          issue: true,
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
      if (
        !canResolveIssue({
          status: req.status as RequestStatus,
          issue: req.issue,
        })
      ) {
        return { success: false, error: "Няма активен сигнал по тази заявка." };
      }

      await db
        .update(requests)
        .set({
          issue: false,
          issueNote: null,
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

async function validateDispatchTarget(
  requestId: number,
  specialistId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
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
  if (
    !canClaim({
      status: req.status as RequestStatus,
      cancelled: req.cancelled,
      specialistId: req.specialistId,
    })
  ) {
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

  return { ok: true };
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

  const candidate = await validateDispatchTarget(requestId, specialistId);
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
      recommendedSpecialistId: null,
      dispatchedByAdmin: true,
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

  const candidate = await validateDispatchTarget(requestId, specialistId);
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
      recommendedSpecialistId: specialistId,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  revalidateWorkspaceRequests();
  revalidatePath("/specialist/opportunities");
  return { success: true, mode: "db" };
}
