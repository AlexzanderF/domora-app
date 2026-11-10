import type { Actor } from "@/domain/authorization";

// Framework-free (no next/*): the errors and Actor guards shared by the
// requests, dispatch, disputes and photos modules.

export type RequestErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "INVALID_STATE"
  | "PRICE_CHANGED";

export class RequestError extends Error {
  constructor(
    readonly code: RequestErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

export function requireActor(actor: Actor | null): Actor {
  if (!actor) {
    throw new RequestError("UNAUTHENTICATED", "Sign-in is required.");
  }
  return actor;
}

export function forbidden(): never {
  throw new RequestError("FORBIDDEN", "This actor may not do that.");
}

export function invalidState(message: string): never {
  throw new RequestError("INVALID_STATE", message);
}
