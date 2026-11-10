import { describe, expect, it } from "vitest";
import { hashSessionToken } from "./token";

describe("hashSessionToken", () => {
  it("returns the sha256 hex digest of the token", () => {
    expect(hashSessionToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("is deterministic and never returns the raw token", () => {
    const token = crypto.randomUUID();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toContain(token);
  });
});
