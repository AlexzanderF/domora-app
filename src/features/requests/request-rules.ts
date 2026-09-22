import { RequestStatus } from "./types";

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
  [RequestStatus.Created]: RequestStatus.Accepted,
  [RequestStatus.Accepted]: RequestStatus.InProgress,
  [RequestStatus.InProgress]: RequestStatus.AwaitingConfirmation,
  [RequestStatus.AwaitingConfirmation]: RequestStatus.Completed,
  [RequestStatus.Completed]: RequestStatus.Completed,
};

// Stages still in flight (visible in agendas and active counters).
const ACTIVE_STAGES: readonly RequestStatus[] = [
  RequestStatus.Accepted,
  RequestStatus.InProgress,
  RequestStatus.AwaitingConfirmation,
];

// Stages before client confirmation (client can still cancel or be served).
const PRE_CONFIRMATION_STAGES: readonly RequestStatus[] = [
  RequestStatus.Created,
  RequestStatus.Accepted,
  RequestStatus.InProgress,
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
    request.status === RequestStatus.Created &&
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
  return status === RequestStatus.InProgress;
}

export function canConfirmCompletion(request: RuleCheckRequest): boolean {
  return (
    !request.cancelled && request.status === RequestStatus.AwaitingConfirmation
  );
}

export function canFlagIssue(request: RuleCheckRequest): boolean {
  return (
    !request.cancelled &&
    request.status === RequestStatus.AwaitingConfirmation &&
    !request.issue
  );
}

export function canResolveIssue(request: RuleCheckRequest): boolean {
  return request.issue === true;
}

export function canRate(request: RuleCheckRequest, rating: unknown): boolean {
  return (
    !request.cancelled &&
    request.status === RequestStatus.Completed &&
    request.rating == null &&
    isValidRating(rating)
  );
}

export function canCancelAsClient(request: RuleCheckRequest): boolean {
  return !request.cancelled && PRE_CONFIRMATION_STAGES.includes(request.status);
}
