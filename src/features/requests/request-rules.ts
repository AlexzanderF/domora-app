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

export function isValidRating(rating: unknown): rating is number {
  return (
    Number.isInteger(rating) &&
    (rating as number) >= 1 &&
    (rating as number) <= 5
  );
}

// Unassigned and claimable: the entry point for accept, admin dispatch,
// and recommendations.
export function canClaim(request: RuleCheckRequest): boolean {
  return (
    !request.cancelled && request.status === 0 && request.specialistId == null
  );
}

// Specialist execution step: unassigned work is claimed (0 → 1), accepted
// work (or legacy 2) jumps straight to 3 ("В процес"), skipping the
// intermediate travelling stage.
export function nextExecutionStep(status: RequestStatus): RequestStatus {
  if (status === 0) return 1;
  if (status === 1 || status === 2) return 3;
  if (status === 3) return 4;
  if (status === 4) return 5;
  return status;
}

export function canAdvance(request: RuleCheckRequest): boolean {
  return !request.cancelled && request.status < 4;
}

export function requiresCompletionReport(status: RequestStatus): boolean {
  return status === 3;
}

export function canConfirmCompletion(request: RuleCheckRequest): boolean {
  return !request.cancelled && request.status === 4;
}

export function canFlagIssue(request: RuleCheckRequest): boolean {
  return !request.cancelled && request.status === 4 && !request.issue;
}

export function canResolveIssue(request: RuleCheckRequest): boolean {
  return request.issue === true;
}

export function canRate(request: RuleCheckRequest, rating: unknown): boolean {
  return (
    !request.cancelled &&
    request.status === 5 &&
    request.rating == null &&
    isValidRating(rating)
  );
}

export function canCancelAsClient(request: RuleCheckRequest): boolean {
  return !request.cancelled && request.status < 4;
}
