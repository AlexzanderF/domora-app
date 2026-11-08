"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { requests, users } from "@/db/schema";
import {
  RequestError,
  cancelRequest,
  confirmCompletion,
  createRequest,
  getRequest,
  rateRequest,
  startWork,
  submitReport,
} from "@/domain/requests";
import type { RequestErrorCode } from "@/domain/requests";
import type { Actor } from "@/domain/authorization";
import { getActor } from "@/features/auth/server/actor";
import { getServerSession } from "@/features/auth/server/session";
import { UserRole, UserStatus } from "@/features/auth/types";
import { canClaim, canFlagIssue, canResolveIssue } from "../request-rules";
import { RequestPriority, RequestStatus } from "../types";
import type { CategoryId, Plan, RequestAction, ServiceRequest } from "../types";

export interface CreateServiceRequestInput {
  category: CategoryId;
  service: string;
  address: string;
  description: string;
  date?: string;
  time?: string;
  price: number;
  plan?: Plan;
  priority?: RequestPriority;
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

const DEFAULT_ERRORS: Record<RequestErrorCode, string> = {
  UNAUTHENTICATED: "Неоторизиран достъп.",
  FORBIDDEN: "Нямате право да извършите това действие.",
  NOT_FOUND: "Заявката не е намерена.",
  INVALID_INPUT: "Невалидни данни.",
  INVALID_STATE: "Действието не е възможно на този етап от заявката.",
};

// Runs a domain call as the signed-in actor and maps its outcome to the
// action result shape; domain rejections become Bulgarian messages.
async function runAsActor(
  run: (actor: Actor | null) => Promise<ServiceRequest | void>,
  messages: Partial<Record<RequestErrorCode, string>> = {},
): Promise<ServiceRequestActionResult> {
  try {
    const request = await run(await getActor());
    revalidateWorkspaceRequests();
    return request
      ? { success: true, mode: "db", request }
      : { success: true, mode: "db" };
  } catch (error) {
    if (error instanceof RequestError) {
      return {
        success: false,
        error: messages[error.code] ?? DEFAULT_ERRORS[error.code],
      };
    }
    throw error;
  }
}

export async function createServiceRequestAction(
  input: CreateServiceRequestInput,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured) {
    return { success: true, mode: "demo" };
  }

  const user = await getServerSession();
  if (!user) {
    return { success: true, mode: "demo" };
  }

  return runAsActor(
    async (actor) => {
      const created = await createRequest(actor, {
        category: input.category,
        service: input.service,
        description: input.description,
        address: input.address,
        price: input.price,
        priority: input.priority,
        scheduledDate: input.date ?? "",
        scheduledTime: input.time ?? "",
      });
      return {
        id: created.id,
        category: input.category,
        service: created.title,
        address: created.address,
        date: created.scheduledDate ?? "",
        time: created.scheduledTime ?? "",
        price: created.price,
        status: created.status,
        description: created.description,
        plan: input.plan,
      };
    },
    {
      INVALID_INPUT:
        "Моля, въведете коректен адрес, услуга, описание с поне 5 символа, дата и час и валидна цена.",
    },
  );
}

export async function assignSpecialistAction(
  requestId: number,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured) {
    return { success: true, mode: "demo" };
  }

  const user = await getServerSession();
  if (
    !user ||
    (user.role !== UserRole.Specialist && user.role !== UserRole.Admin)
  ) {
    return {
      success: false,
      error: "Само специалист или администратор може да приема заявки.",
    };
  }

  if (user.role === UserRole.Specialist && user.status !== UserStatus.Active) {
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
      status: existing.status,
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
      status: RequestStatus.Accepted,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(requests.id, requestId),
        eq(requests.status, RequestStatus.Created),
      ),
    );

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
  if (!isDbConfigured) {
    return { success: true, mode: "demo" };
  }
  return runAsActor(
    async (actor) => {
      await startWork(actor, requestId);
    },
    { INVALID_STATE: "Заявката не може да бъде започната на този етап." },
  );
}

// The specialist's work completion report. The client's later confirmation
// goes through the "complete" transition.
export async function completeWorkAction(
  requestId: number,
  report?: string,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured) {
    return { success: true, mode: "demo" };
  }
  return runAsActor(
    async (actor) => {
      await submitReport(actor, requestId, report ?? "");
    },
    {
      INVALID_INPUT: "Отчетът е задължителен, за да завършите задачата.",
      INVALID_STATE: "Задачата не е в етап, който може да бъде завършен.",
    },
  );
}

export async function cancelRequestAction(
  requestId: number,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured) {
    return { success: true, mode: "demo" };
  }
  return runAsActor(
    async (actor) => {
      await cancelRequest(actor, requestId);
    },
    { INVALID_STATE: "Заявката вече не може да бъде отказана." },
  );
}

export async function transitionRequestServerAction(
  requestId: number,
  action: RequestAction,
): Promise<ServiceRequestActionResult> {
  if (!isDbConfigured) {
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

      if (req.status === RequestStatus.Created) {
        return assignSpecialistAction(requestId);
      }
      if (req.status === RequestStatus.InProgress) {
        return completeWorkAction(requestId, action.report);
      }
      return startWorkAction(requestId);
    }
    case "complete":
      return runAsActor(
        async (actor) => {
          await confirmCompletion(actor, requestId);
        },
        { INVALID_STATE: "Няма завършена работа, която да потвърдите." },
      );
    case "cancel":
      return cancelRequestAction(requestId);
    case "decline":
      // An unassigned request has nothing to hand back: declining it only
      // dismisses it for this specialist.
      return runAsActor(
        async (actor) => {
          const current = await getRequest(actor, requestId);
          if (actor?.role === UserRole.Specialist && !current.specialistId) {
            return;
          }
          await cancelRequest(actor, requestId);
        },
        { INVALID_STATE: "Заявката вече не може да бъде отказана." },
      );
    case "rate":
      return runAsActor(
        async (actor) => {
          await rateRequest(actor, requestId, action.rating);
        },
        {
          INVALID_INPUT: "Оценката трябва да е цяло число от 1 до 5.",
          INVALID_STATE: "Тази заявка не може да бъде оценена.",
        },
      );
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
          status: req.status,
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
          issueOpenedAt: new Date(),
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
          status: req.status,
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
  if (!currentUser || currentUser.role !== UserRole.Admin) {
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
      status: req.status,
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
    specialist.role !== UserRole.Specialist ||
    specialist.status !== UserStatus.Active
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
  if (!isDbConfigured) {
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
      status: RequestStatus.Accepted,
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
  if (!isDbConfigured) {
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
