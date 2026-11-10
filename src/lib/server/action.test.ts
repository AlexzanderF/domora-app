import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath, getActor, dbState } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  getActor: vi.fn(),
  dbState: { configured: true },
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/features/auth/server/actor", () => ({ getActor }));
vi.mock("@/db", () => ({
  get isDbConfigured() {
    return dbState.configured;
  },
}));

import { IdentityError } from "@/domain/identity";
import { RequestError } from "@/domain/requests";
import { SubscriptionError } from "@/domain/subscriptions";
import { runAction } from "./action";

const GENERIC = "Грешка при изпълнение на действието. Опитайте отново.";

beforeEach(() => {
  revalidatePath.mockReset();
  getActor.mockReset();
  getActor.mockResolvedValue({ id: 7, role: "client", status: "active" });
  dbState.configured = true;
});

describe("runAction", () => {
  it("passes the actor to the domain call and returns its data", async () => {
    const run = vi.fn().mockResolvedValue({ id: 1 });
    const result = await runAction({ run });
    expect(run).toHaveBeenCalledWith({
      id: 7,
      role: "client",
      status: "active",
    });
    expect(result).toEqual({ success: true, data: { id: 1 } });
  });

  it("omits data when the domain call returns nothing", async () => {
    const result = await runAction({ run: async () => undefined });
    expect(result).toEqual({ success: true });
  });

  it("revalidates every path of the named sets on success only", async () => {
    await runAction({
      revalidate: ["subscriptions"],
      run: async () => undefined,
    });
    expect(revalidatePath.mock.calls.map(([p]) => p)).toEqual([
      "/client/plan",
      "/client/requests",
      "/client",
    ]);

    revalidatePath.mockReset();
    await runAction({
      revalidate: ["subscriptions"],
      run: async () => {
        throw new RequestError("FORBIDDEN", "x");
      },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("reports missing database without running the call", async () => {
    dbState.configured = false;
    const run = vi.fn();
    const result = await runAction({ run });
    expect(run).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Няма връзка с базата данни.",
    });
  });

  it.each([
    [new RequestError("NOT_FOUND", "x"), "Заявката не е намерена."],
    [
      new IdentityError("FORBIDDEN", "x"),
      "Нямате право да извършите това действие.",
    ],
    [new SubscriptionError("INVALID_INPUT", "x"), "Невалидни данни."],
    [
      new RequestError("INVALID_STATE", "x"),
      "Действието не е възможно на този етап от заявката.",
    ],
    [new RequestError("UNAUTHENTICATED", "x"), "Неоторизиран достъп."],
    [
      new IdentityError("EMAIL_TAKEN", "x"),
      "Вече съществува потребител с този имейл адрес.",
    ],
    [
      new IdentityError("PHONE_TAKEN", "x"),
      "Вече съществува потребител с този телефонен номер.",
    ],
    [
      new IdentityError("INVALID_CREDENTIALS", "x"),
      "Невалиден имейл/телефон или парола.",
    ],
    [
      new IdentityError("REJECTED_SPECIALIST", "x"),
      "Кандидатурата ви като специалист е отказана. За повече информация се свържете с екипа на DOMORA.",
    ],
  ])("maps domain error %# to Bulgarian default copy", async (error, text) => {
    const result = await runAction({
      run: async () => {
        throw error;
      },
    });
    expect(result).toEqual({ success: false, error: text });
  });

  it("lets per-call overrides replace the defaults", async () => {
    const result = await runAction({
      messages: { NOT_FOUND: "Специалистът не е намерен." },
      run: async () => {
        throw new IdentityError("NOT_FOUND", "x");
      },
    });
    expect(result.error).toBe("Специалистът не е намерен.");
  });

  it("returns the generic message and logs unexpected errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("connection refused: secret-host");
    const result = await runAction({
      run: async () => {
        throw boom;
      },
    });
    expect(result).toEqual({ success: false, error: GENERIC });
    expect(log).toHaveBeenCalledWith(expect.any(String), boom);
    log.mockRestore();
  });
});
