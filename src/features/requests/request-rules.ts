import type { RequestStatus } from "./types";

// Minimal structural input shared by the in-memory transition seam and the
// database-backed server actions, so both enforce identical lifecycle rules.
export interface RuleCheckRequest {
  status: RequestStatus;
  cancelled?: boolean | null;
  rating?: number | null;
  issue?: boolean | null;
  specialistId?: number | null;
}

// Ordered execution pipeline: every stage knows its successor.
const NEXT_STEP: Record<RequestStatus, RequestStatus> = {
  CREATED: "ACCEPTED",
  ACCEPTED: "IN_PROGRESS",
  IN_PROGRESS: "AWAITING_CONFIRMATION",
  AWAITING_CONFIRMATION: "COMPLETED",
  COMPLETED: "COMPLETED",
};

// Stages still in flight (visible in agendas and active counters).
const ACTIVE_STAGES: readonly RequestStatus[] = [
  "ACCEPTED",
  "IN_PROGRESS",
  "AWAITING_CONFIRMATION",
];

// Stages before client confirmation (client can still cancel or be served).
const PRE_CONFIRMATION_STAGES: readonly RequestStatus[] = [
  "CREATED",
  "ACCEPTED",
  "IN_PROGRESS",
];

export function isValidRating(rating: unknown): rating is number {
  return (
    Number.isInteger(rating) &&
    (rating as number) >= 1 &&
    (rating as number) <= 5
  );
}

export function isActiveStage(status: RequestStatus): boolean {
  return ACTIVE_STAGES.includes(status);
}

// Unassigned and claimable: the entry point for accept, admin dispatch,
// and recommendations.
export function canClaim(request: RuleCheckRequest): boolean {
  return (
    !request.cancelled &&
    request.status === "CREATED" &&
    request.specialistId == null
  );
}

// Specialist execution step: unassigned work is claimed, accepted work jumps
// straight to "В процес".
export function nextExecutionStep(status: RequestStatus): RequestStatus {
  return NEXT_STEP[status];
}

export function canAdvance(request: RuleCheckRequest): boolean {
  return !request.cancelled && PRE_CONFIRMATION_STAGES.includes(request.status);
}

export function requiresCompletionReport(status: RequestStatus): boolean {
  return status === "IN_PROGRESS";
}

export function canConfirmCompletion(request: RuleCheckRequest): boolean {
  return !request.cancelled && request.status === "AWAITING_CONFIRMATION";
}

export function canFlagIssue(request: RuleCheckRequest): boolean {
  return (
    !request.cancelled &&
    request.status === "AWAITING_CONFIRMATION" &&
    !request.issue
  );
}

export function canResolveIssue(request: RuleCheckRequest): boolean {
  return request.issue === true;
}

export function canRate(request: RuleCheckRequest, rating: unknown): boolean {
  return (
    !request.cancelled &&
    request.status === "COMPLETED" &&
    request.rating == null &&
    isValidRating(rating)
  );
}

export function canCancelAsClient(request: RuleCheckRequest): boolean {
  return !request.cancelled && PRE_CONFIRMATION_STAGES.includes(request.status);
}
