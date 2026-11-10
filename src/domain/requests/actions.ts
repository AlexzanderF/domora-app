import { can } from "@/domain/authorization";
import type { Actor } from "@/domain/authorization";
import {
  canCancelAsClient,
  canClaim,
  canConfirmCompletion,
  canHandBack,
  canRaiseDispute,
  canRate,
  canResolveDispute,
  canStartWork,
  requiresCompletionReport,
} from "./lifecycle";
import type { RuleCheckRequest } from "./lifecycle";

// One kind per authorization action and domain function.
export const ACTION_KINDS = [
  "cancel",
  "release",
  "claim",
  "start",
  "submitReport",
  "confirm",
  "dispute",
  "rate",
  "assign",
  "recommend",
  "declineRecommendation",
  "resolveDispute",
] as const;
export type ActionKind = (typeof ACTION_KINDS)[number];

// What the lifecycle and the policy need to know about a request.
export interface ActionSubject extends RuleCheckRequest {
  clientId: number;
  specialistId: number | null;
  recommendedSpecialistId: number | null;
}

// The action kinds the actor may take on the request right now: the lifecycle
// says what the stage allows, the policy says who may do it. Pure.
export function availableActions(
  actor: Actor,
  request: ActionSubject,
): ActionKind[] {
  const may = (action: Parameters<typeof can>[1]) =>
    can(actor, action, request);
  const open = canClaim(request);
  const allowed: Record<ActionKind, boolean> = {
    cancel: may("request.cancel") && canCancelAsClient(request),
    release: may("request.release") && canHandBack(request),
    claim: may("request.claim") && open,
    start: may("request.work") && canStartWork(request),
    submitReport:
      may("request.work") &&
      !request.cancelled &&
      requiresCompletionReport(request.status),
    confirm: may("request.confirm") && canConfirmCompletion(request),
    dispute: may("request.dispute") && canRaiseDispute(request),
    rate: may("request.rate") && canRate(request, 1),
    assign: may("request.assign") && open,
    recommend: may("request.assign") && open,
    declineRecommendation:
      may("request.claim") &&
      open &&
      request.recommendedSpecialistId === actor.id,
    resolveDispute:
      may("request.resolve_dispute") && canResolveDispute(request),
  };
  return ACTION_KINDS.filter((kind) => allowed[kind]);
}

// The one place a request view model gets its `actions`: every query mapper
// passes its view and the row it came from through here.
export function withActions<T extends object>(
  actor: Actor,
  view: T,
  subject: ActionSubject,
): T & { actions: ActionKind[] } {
  return { ...view, actions: availableActions(actor, subject) };
}
