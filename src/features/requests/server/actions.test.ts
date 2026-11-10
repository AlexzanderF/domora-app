import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath, getActor, dbState, domain } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  getActor: vi.fn(),
  dbState: { configured: true },
  domain: {
    createRequest: vi.fn(),
    recommendRequest: vi.fn(),
    cancelRequest: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/features/auth/server/actor", () => ({ getActor }));
vi.mock("@/db", () => ({
  get isDbConfigured() {
    return dbState.configured;
  },
}));
vi.mock("@/domain/pricing/tariffs", async (original) => ({
  ...(await original<typeof import("@/domain/pricing/tariffs")>()),
  findTariffs: vi.fn().mockResolvedValue({ marker: "fresh" }),
}));
vi.mock("@/domain/dispatch", () => ({
  assignSpecialist: vi.fn(),
  claimRequest: vi.fn(),
  declineRecommendation: vi.fn(),
  recommendRequest: domain.recommendRequest,
}));
vi.mock("@/domain/requests", async (original) => ({
  ...(await original<typeof import("@/domain/requests")>()),
  createRequest: domain.createRequest,
  cancelRequest: domain.cancelRequest,
}));

import { RequestError } from "@/domain/requests";
import {
  adminRecommendSpecialistAction,
  cancelRequestAction,
  createServiceRequestAction,
} from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  getActor.mockResolvedValue({ id: 1, role: "admin", status: "active" });
  dbState.configured = true;
});

describe("request actions", () => {
  it("shares the single database guard", async () => {
    dbState.configured = false;
    expect(await cancelRequestAction(1)).toEqual({
      success: false,
      error: "Няма връзка с базата данни.",
    });
    expect(domain.cancelRequest).not.toHaveBeenCalled();
  });

  it("returns fresh tariffs with the price-changed message", async () => {
    domain.createRequest.mockRejectedValue(
      new RequestError("PRICE_CHANGED", "stale"),
    );
    const result = await createServiceRequestAction({
      category: "plumbing",
      service: "x",
      address: "a",
      description: "d",
      expectedPrice: 1,
    } as never);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Цената е променена, моля прегледайте отново.");
    expect(result.tariffs).toEqual({ marker: "fresh" });
  });

  it("revalidates the opportunities for dispatch actions", async () => {
    domain.recommendRequest.mockResolvedValue(undefined);
    await adminRecommendSpecialistAction(1, 2);
    expect(revalidatePath).toHaveBeenCalledWith("/specialist/opportunities");
  });
});
