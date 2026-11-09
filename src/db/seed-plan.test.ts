import { describe, expect, it } from "vitest";
import { resolveSeedPlan } from "./seed-plan";

const adminEnv = {
  ADMIN_NAME: "Първи админ",
  ADMIN_EMAIL: "owner@example.com",
  ADMIN_PHONE: "0899000111",
  ADMIN_PASSWORD: "a-long-password",
};

describe("resolveSeedPlan", () => {
  it("seeds demo data by default outside production", () => {
    expect(resolveSeedPlan({}, [])).toEqual({ demo: true, admin: null });
    expect(resolveSeedPlan({ NODE_ENV: "development" }, [])).toMatchObject({
      demo: true,
    });
  });

  it("seeds reference data only in production", () => {
    expect(resolveSeedPlan({ NODE_ENV: "production" }, [])).toEqual({
      demo: false,
      admin: null,
    });
  });

  it("refuses demo data in production, even when asked", () => {
    expect(() =>
      resolveSeedPlan({ NODE_ENV: "production" }, ["--demo"]),
    ).toThrow(/production/i);
  });

  it("refuses demo data into a non-local database", () => {
    const env = { DATABASE_URL: "postgresql://u:p@db.example.com:5432/app" };
    expect(() => resolveSeedPlan(env, [])).toThrow(/non-local/);
    expect(resolveSeedPlan(env, ["--reference-only"]).demo).toBe(false);
    expect(
      resolveSeedPlan({ DATABASE_URL: "postgresql://u:p@localhost/app" }, [])
        .demo,
    ).toBe(true);
  });

  it("lets development skip demo data", () => {
    expect(resolveSeedPlan({}, ["--reference-only"])).toEqual({
      demo: false,
      admin: null,
    });
  });

  it("reads the admin bootstrap from the environment", () => {
    expect(
      resolveSeedPlan({ NODE_ENV: "production", ...adminEnv }, []).admin,
    ).toEqual({
      name: "Първи админ",
      email: "owner@example.com",
      phone: "0899000111",
      password: "a-long-password",
    });
  });

  it("requires every admin variable once any is set", () => {
    expect(() =>
      resolveSeedPlan(
        { NODE_ENV: "production", ADMIN_EMAIL: "owner@example.com" },
        [],
      ),
    ).toThrow(/ADMIN_NAME/);
  });

  it("requires a strong password for the bootstrapped admin", () => {
    expect(() =>
      resolveSeedPlan(
        { NODE_ENV: "production", ...adminEnv, ADMIN_PASSWORD: "short" },
        [],
      ),
    ).toThrow(/ADMIN_PASSWORD/);
  });
});
