import { createHash } from "node:crypto";

// Only the sha256 digest of a session token is stored, so a leaked
// sessions table cannot be replayed as cookies.
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
