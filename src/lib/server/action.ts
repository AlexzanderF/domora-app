import { revalidatePath } from "next/cache";
import { isDbConfigured } from "@/db";
import type { Actor } from "@/domain/authorization";
import { IdentityError } from "@/domain/identity";
import { PricingError } from "@/domain/pricing/tariffs";
import { RequestError } from "@/domain/requests";
import { SubscriptionError } from "@/domain/subscriptions";
import { getActor } from "@/features/auth/server/actor";

// The one adapter behind Server Actions: resolves the Actor, guards database
// availability, runs the domain call, turns domain error codes into Bulgarian
// feedback and revalidates named path sets. It lives outside features so every
// feature can use it (ADR 0007).

export type ActionErrorCode =
  | "NO_DATABASE"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "INVALID_STATE"
  | "PRICE_CHANGED"
  | "EMAIL_TAKEN"
  | "PHONE_TAKEN"
  | "INVALID_CREDENTIALS"
  | "REJECTED_SPECIALIST"
  | "INVALID_TOKEN";

export interface ActionResult<T = never> {
  success: boolean;
  error?: string;
  // Set on failures that map to a domain/guard code, for callers that branch on it.
  code?: ActionErrorCode;
  data?: T;
}

export const PRICE_CHANGED_MESSAGE =
  "Цената е променена, моля прегледайте отново.";

const DEFAULT_MESSAGES: Record<ActionErrorCode, string> = {
  NO_DATABASE: "Няма връзка с базата данни.",
  UNAUTHENTICATED: "Неоторизиран достъп.",
  FORBIDDEN: "Нямате право да извършите това действие.",
  NOT_FOUND: "Заявката не е намерена.",
  INVALID_INPUT: "Невалидни данни.",
  INVALID_STATE: "Действието не е възможно на този етап от заявката.",
  PRICE_CHANGED: PRICE_CHANGED_MESSAGE,
  EMAIL_TAKEN: "Вече съществува потребител с този имейл адрес.",
  PHONE_TAKEN: "Вече съществува потребител с този телефонен номер.",
  INVALID_CREDENTIALS: "Невалиден имейл/телефон или парола.",
  REJECTED_SPECIALIST:
    "Кандидатурата ви като специалист е отказана. За повече информация се свържете с екипа на DOMORA.",
  INVALID_TOKEN: "Връзката е невалидна или е изтекла.",
};

const GENERIC_ERROR = "Грешка при изпълнение на действието. Опитайте отново.";

// Path sets, defined once.
const REVALIDATION_SETS = {
  requests: [
    "/requests",
    "/client/requests",
    "/client",
    "/specialist",
    "/admin",
  ],
  dispatch: [
    "/requests",
    "/client/requests",
    "/client",
    "/specialist",
    "/specialist/opportunities",
    "/admin",
  ],
  subscriptions: ["/client/plan", "/client/requests", "/client"],
  tariffs: ["/admin", "/plans", "/"],
  profile: ["/client/profile"],
  specialists: [
    "/admin/specialists",
    "/admin",
    "/pending-approval",
    "/specialist",
  ],
} as const;

export type RevalidationSet = keyof typeof REVALIDATION_SETS;

export interface RunActionOptions<T> {
  run: (actor: Actor | null) => Promise<T>;
  // Per-call copy that replaces the shared defaults for a code.
  messages?: Partial<Record<ActionErrorCode, string>>;
  revalidate?: readonly RevalidationSet[];
}

function domainErrorCode(error: unknown): ActionErrorCode | null {
  if (
    error instanceof RequestError ||
    error instanceof SubscriptionError ||
    error instanceof IdentityError ||
    error instanceof PricingError
  ) {
    return error.code in DEFAULT_MESSAGES
      ? (error.code as ActionErrorCode)
      : "INVALID_INPUT";
  }
  return null;
}

export async function runAction<T = void>({
  run,
  messages = {},
  revalidate = [],
}: RunActionOptions<T>): Promise<ActionResult<Exclude<T, void | undefined>>> {
  const message = (code: ActionErrorCode) =>
    messages[code] ?? DEFAULT_MESSAGES[code];

  if (!isDbConfigured) {
    return {
      success: false,
      error: message("NO_DATABASE"),
    };
  }

  try {
    const data = await run(await getActor());
    for (const set of revalidate) {
      for (const path of REVALIDATION_SETS[set]) revalidatePath(path);
    }
    return data === undefined || data === null
      ? { success: true }
      : { success: true, data: data as Exclude<T, void | undefined> };
  } catch (error) {
    const code = domainErrorCode(error);
    if (code) return { success: false, error: message(code), code };
    console.error("Server Action failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
