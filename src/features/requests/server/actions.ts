"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { requests } from "@/db/schema";
import { raiseIssue, resolveIssue } from "@/domain/disputes";
import {
  assignSpecialist,
  claimRequest,
  declineRecommendation,
  recommendRequest,
} from "@/domain/dispatch";
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
import { UserRole } from "@/features/auth/types";
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
  return runAsActor(
    async (actor) => {
      await claimRequest(actor, requestId);
    },
    {
      FORBIDDEN:
        "Не можете да приемете тази заявка. Профилът ви трябва да е одобрен, а категорията и районът — да съвпадат.",
      INVALID_STATE: "Заявката вече е разпределена.",
    },
  );
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
      // A recommended job returns to the open pool; declining anything else
      // unassigned only dismisses it for this specialist.
      return runAsActor(
        async (actor) => {
          const current = await getRequest(actor, requestId);
          if (actor?.role === UserRole.Specialist && !current.specialistId) {
            if (current.recommendedSpecialistId === actor.id) {
              await declineRecommendation(actor, requestId);
            }
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
    case "issue":
      return runAsActor(
        async (actor) => {
          await raiseIssue(actor, requestId, action.note ?? "");
        },
        {
          FORBIDDEN: "Само клиентът на заявката може да подаде сигнал.",
          INVALID_INPUT: "Моля, опишете проблема (до 2000 символа).",
          INVALID_STATE:
            "Сигнал за проблем може да се подаде след приключване на работата.",
        },
      );
    case "resolve":
      return runAsActor(
        async (actor) => {
          await resolveIssue(actor, requestId, action.resolutionNote);
        },
        {
          FORBIDDEN: "Неоторизиран достъп. Изискват се администраторски права.",
          INVALID_INPUT: "Бележката към решението е твърде дълга.",
          NOT_FOUND: "Заявката не е намерена.",
          INVALID_STATE: "Няма активен сигнал по тази заявка.",
        },
      );
    default:
      return { success: true, mode: "db" };
  }
}

const DISPATCH_ERRORS: Partial<Record<RequestErrorCode, string>> = {
  FORBIDDEN: "Неоторизиран достъп. Изискват се администраторски права.",
  INVALID_INPUT: "Избраният специалист не е активен.",
  INVALID_STATE: "Заявката вече е разпределена.",
};

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
  const result = await runAsActor(async (actor) => {
    await assignSpecialist(actor, requestId, specialistId);
  }, DISPATCH_ERRORS);
  if (result.success) revalidatePath("/specialist/opportunities");
  return result;
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
  const result = await runAsActor(async (actor) => {
    await recommendRequest(actor, requestId, specialistId);
  }, DISPATCH_ERRORS);
  if (result.success) revalidatePath("/specialist/opportunities");
  return result;
}
