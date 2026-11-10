"use server";

import { raiseDispute, resolveDispute } from "@/domain/disputes";
import {
  assignSpecialist,
  claimRequest,
  declineRecommendation,
  recommendRequest,
} from "@/domain/dispatch";
import {
  requireActor,
  cancelRequest,
  releaseRequest,
  confirmCompletion,
  createRequest,
  rateRequest,
  startWork,
  submitReport,
} from "@/domain/requests";
import { withActions } from "@/domain/requests/actions";
import { findTariffs } from "@/domain/pricing/tariffs";
import { PRICE_CHANGED_MESSAGE, runAction } from "@/lib/server/action";
import type {
  ActionErrorCode,
  ActionResult,
  RevalidationSet,
} from "@/lib/server/action";
import type { Actor } from "@/domain/authorization";
import type { RequestPriority } from "@/domain/requests/types";
import type {
  CategoryId,
  Plan,
  ServiceRequest,
  Tariffs,
} from "@/domain/requests/types";

export interface CreateServiceRequestInput {
  category: CategoryId;
  service: string;
  address: string;
  description: string;
  date?: string;
  time?: string;
  // The price the dialog displayed; the server prices the booking itself.
  expectedPrice: number;
  serviceIndex?: number;
  quantity?: number;
  plan?: Plan;
  priority?: RequestPriority;
}

export type ServiceRequestActionResult = ActionResult<ServiceRequest> & {
  // Fresh Tariffs, returned when a booking was rejected for a stale price.
  tariffs?: Tariffs;
};

const run = (
  action: (actor: Actor | null) => Promise<ServiceRequest | void>,
  messages: Partial<Record<ActionErrorCode, string>> = {},
  revalidate: readonly RevalidationSet[] = ["requests"],
): Promise<ServiceRequestActionResult> =>
  runAction({ run: action, messages, revalidate });

export async function createServiceRequestAction(
  input: CreateServiceRequestInput,
): Promise<ServiceRequestActionResult> {
  const result = await run(
    async (actor) => {
      const created = await createRequest(actor, {
        category: input.category,
        service: input.service,
        description: input.description,
        address: input.address,
        expectedPrice: input.expectedPrice,
        serviceIndex: input.serviceIndex,
        plan: input.plan,
        quantity: input.quantity,
        priority: input.priority,
        scheduledDate: input.date ?? "",
        scheduledTime: input.time ?? "",
      });
      return withActions(
        requireActor(actor),
        {
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
        },
        created,
      );
    },
    {
      INVALID_INPUT:
        "Моля, въведете коректен адрес, услуга, описание с поне 5 символа, дата и час.",
    },
  );
  return !result.success && result.error === PRICE_CHANGED_MESSAGE
    ? { ...result, tariffs: await findTariffs() }
    : result;
}

export async function assignSpecialistAction(
  requestId: number,
): Promise<ServiceRequestActionResult> {
  return run(
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
  return run(
    async (actor) => {
      await startWork(actor, requestId);
    },
    { INVALID_STATE: "Заявката не може да бъде започната на този етап." },
  );
}

// The specialist's work completion report; the client confirms it later.
export async function completeWorkAction(
  requestId: number,
  report?: string,
): Promise<ServiceRequestActionResult> {
  return run(
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
  return run(
    async (actor) => {
      await cancelRequest(actor, requestId);
    },
    { INVALID_STATE: "Заявката вече не може да бъде отказана." },
  );
}

// The Specialist's Hand-back: the request returns to the open pool.
export async function releaseRequestAction(
  requestId: number,
): Promise<ServiceRequestActionResult> {
  return run(
    async (actor) => {
      await releaseRequest(actor, requestId);
    },
    { INVALID_STATE: "Заявката вече не може да бъде отказана." },
  );
}

export async function declineRecommendationAction(
  requestId: number,
): Promise<ServiceRequestActionResult> {
  return run(
    async (actor) => {
      await declineRecommendation(actor, requestId);
    },
    { INVALID_STATE: "Заявката вече не може да бъде отказана." },
  );
}

export async function confirmCompletionAction(
  requestId: number,
): Promise<ServiceRequestActionResult> {
  return run(
    async (actor) => {
      await confirmCompletion(actor, requestId);
    },
    { INVALID_STATE: "Няма завършена работа, която да потвърдите." },
  );
}

export async function rateRequestAction(
  requestId: number,
  rating: number,
): Promise<ServiceRequestActionResult> {
  return run(
    async (actor) => {
      await rateRequest(actor, requestId, rating);
    },
    {
      INVALID_INPUT: "Оценката трябва да е цяло число от 1 до 5.",
      INVALID_STATE: "Тази заявка не може да бъде оценена.",
    },
  );
}

export async function raiseDisputeAction(
  requestId: number,
  note: string,
): Promise<ServiceRequestActionResult> {
  return run(
    async (actor) => {
      await raiseDispute(actor, requestId, note);
    },
    {
      FORBIDDEN: "Само клиентът на заявката може да подаде сигнал.",
      INVALID_INPUT: "Моля, опишете проблема (до 2000 символа).",
      INVALID_STATE:
        "Сигнал за проблем може да се подаде след приключване на работата.",
    },
  );
}

export async function resolveDisputeAction(
  requestId: number,
  resolutionNote?: string,
): Promise<ServiceRequestActionResult> {
  return run(
    async (actor) => {
      await resolveDispute(actor, requestId, resolutionNote);
    },
    {
      FORBIDDEN: "Неоторизиран достъп. Изискват се администраторски права.",
      INVALID_INPUT: "Бележката към решението е твърде дълга.",
      NOT_FOUND: "Заявката не е намерена.",
      INVALID_STATE: "Няма активен сигнал по тази заявка.",
    },
  );
}

const DISPATCH_MESSAGES: Partial<Record<ActionErrorCode, string>> = {
  NO_DATABASE: "Административният панел изисква база данни.",
  FORBIDDEN: "Неоторизиран достъп. Изискват се администраторски права.",
  INVALID_INPUT: "Избраният специалист не е активен.",
  INVALID_STATE: "Заявката вече е разпределена.",
};

export async function adminAssignSpecialistAction(
  requestId: number,
  specialistId: number,
): Promise<ServiceRequestActionResult> {
  return run(
    async (actor) => {
      await assignSpecialist(actor, requestId, specialistId);
    },
    DISPATCH_MESSAGES,
    ["dispatch"],
  );
}

export async function adminRecommendSpecialistAction(
  requestId: number,
  specialistId: number,
): Promise<ServiceRequestActionResult> {
  return run(
    async (actor) => {
      await recommendRequest(actor, requestId, specialistId);
    },
    DISPATCH_MESSAGES,
    ["dispatch"],
  );
}
