import { UserRole, UserStatus } from "@/domain/identity/types";

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
  | "request.resolve_dispute"
  // Photos are the client's own evidence: only the owner adds them. Unlike
  // request.view, viewing is never open to specialists who merely see the job
  // as an opportunity.
  | "request.attach_photo"
  // The specialist's own evidence on the work completion report.
  | "request.attach_report_photo"
  | "request.view_photo"
  // Saving Tariffs is an administrative act, never bound to a request.
  | "tariffs.update";

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
      // Disputes and photos belong to the request's client or assigned
      // specialist, never added on their behalf.
      return (
        action !== "request.dispute" &&
        action !== "request.attach_photo" &&
        action !== "request.attach_report_photo"
      );
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
    action === "request.dispute" ||
    action === "request.attach_photo" ||
    action === "request.view_photo"
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
    case "request.attach_report_photo":
    case "request.view_photo":
      return assigned;
    default:
      return false;
  }
}
