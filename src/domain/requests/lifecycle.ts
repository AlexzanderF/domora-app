import { RequestStatus } from "@/domain/requests/types";

// Minimal structural input for the lifecycle predicates, so every caller
// enforces identical rules.
export interface RuleCheckRequest {
  status: RequestStatus;
  cancelled?: boolean | null;
  rating?: number | null;
  issue?: boolean | null;
  specialistId?: number | null;
}

// Stages still in flight (visible in agendas and active counters).
export const ACTIVE_STAGES: readonly RequestStatus[] = [
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

export function canAdvance(request: RuleCheckRequest): boolean {
  return !request.cancelled && PRE_CONFIRMATION_STAGES.includes(request.status);
}

// Accepted work the assigned specialist can start.
export function canStartWork(request: RuleCheckRequest): boolean {
  return !request.cancelled && request.status === RequestStatus.Accepted;
}

// Accepted, not yet started work the specialist can hand back to the pool.
export function canHandBack(request: RuleCheckRequest): boolean {
  return !request.cancelled && request.status === RequestStatus.Accepted;
}

export function requiresCompletionReport(status: RequestStatus): boolean {
  return status === RequestStatus.InProgress;
}

export function canConfirmCompletion(request: RuleCheckRequest): boolean {
  return (
    !request.cancelled && request.status === RequestStatus.AwaitingConfirmation
  );
}

export const MAX_DISPUTE_NOTE_LENGTH = 2000;

export function normalizeDisputeNote(value: string | undefined): string {
  return value?.trim() ?? "";
}

// A dispute needs a note, and a bounded one. Shared by the database-backed
// domain modules.
export function isValidDisputeNote(note: string): boolean {
  return note.length > 0 && note.length <= MAX_DISPUTE_NOTE_LENGTH;
}

export function canRaiseDispute(request: RuleCheckRequest): boolean {
  return (
    !request.cancelled &&
    request.status === RequestStatus.AwaitingConfirmation &&
    !request.issue
  );
}

export function canResolveDispute(request: RuleCheckRequest): boolean {
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
