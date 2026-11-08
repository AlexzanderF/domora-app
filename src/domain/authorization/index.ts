import { UserRole, UserStatus } from "@/features/auth/types";

// Role and status always come from the database, never from cookies.
export interface Actor {
  id: number;
  role: UserRole;
  status: UserStatus;
}

export type Action =
  | "request.create"
  | "request.view"
  | "request.claim"
  | "request.work"
  | "request.cancel"
  | "request.confirm"
  | "request.rate"
  | "request.assign"
  | "request.dispute"
  | "request.resolve_dispute";

export interface RequestResource {
  clientId: number;
  specialistId: number | null;
}

// Pure policy: client owns request; specialist assigned (or Active and
// claiming); admin any; Pending/Rejected specialist nothing.
export function can(
  actor: Actor,
  action: Action,
  resource?: RequestResource,
): boolean {
  switch (actor.role) {
    case UserRole.Admin:
      // Disputes are raised by the request's client, never on their behalf.
      return action !== "request.dispute";
    case UserRole.Client:
      return canClient(actor, action, resource);
    case UserRole.Specialist:
      return actor.status === UserStatus.Active
        ? canSpecialist(actor, action, resource)
        : false;
    default:
      return false;
  }
}

function canClient(
  actor: Actor,
  action: Action,
  resource?: RequestResource,
): boolean {
  if (action === "request.create") return true;
  if (!resource || resource.clientId !== actor.id) return false;
  return (
    action === "request.view" ||
    action === "request.cancel" ||
    action === "request.confirm" ||
    action === "request.rate" ||
    action === "request.dispute"
  );
}

function canSpecialist(
  actor: Actor,
  action: Action,
  resource?: RequestResource,
): boolean {
  if (!resource) return false;
  const assigned = resource.specialistId === actor.id;
  switch (action) {
    case "request.view":
      return assigned || resource.specialistId === null;
    case "request.claim":
      return resource.specialistId === null;
    case "request.work":
    case "request.cancel":
      return assigned;
    default:
      return false;
  }
}
