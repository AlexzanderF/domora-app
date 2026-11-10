import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirect, getServerSession, dbState } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  getServerSession: vi.fn(),
  dbState: { isDbConfigured: true },
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/server/session", () => ({
  getServerSession,
  getActor: async () => {
    const u = await getServerSession();
    return u ? { id: u.id, role: u.role, status: u.status } : null;
  },
}));
vi.mock("@/db", () => ({
  get isDbConfigured() {
    return dbState.isDbConfigured;
  },
}));

import { redirectIfSignedIn } from "./actor";

describe("redirectIfSignedIn", () => {
  beforeEach(() => {
    redirect.mockClear();
    getServerSession.mockReset();
    dbState.isDbConfigured = true;
  });

  it("does nothing for a signed-out visitor", async () => {
    getServerSession.mockResolvedValue(null);
    await expect(redirectIfSignedIn()).resolves.toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("does nothing without a database", async () => {
    dbState.isDbConfigured = false;
    await redirectIfSignedIn();
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each([
    ["CLIENT", "ACTIVE", "/client"],
    ["ADMIN", "ACTIVE", "/admin"],
    ["SPECIALIST", "ACTIVE", "/specialist"],
    ["SPECIALIST", "PENDING", "/pending-approval"],
  ])("sends a signed-in %s (%s) to %s", async (role, status, path) => {
    getServerSession.mockResolvedValue({ id: 1, role, status });
    await expect(redirectIfSignedIn()).rejects.toThrow(`REDIRECT:${path}`);
  });
});
