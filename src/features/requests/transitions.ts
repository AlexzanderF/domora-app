import { RequestStatus, Role } from "./types";
import type { RequestAction, ServiceRequest } from "./types";
import {
  canAdvance,
  canCancelAsClient,
  canClaim,
  canConfirmCompletion,
  canFlagIssue,
  canRate,
  canResolveIssue,
  nextExecutionStep,
  requiresCompletionReport,
} from "./request-rules";

// These guards keep the demo consistent. They are not server-side authorization.
// Lifecycle rules themselves live in request-rules.ts, shared with the
// database-backed server actions.
export function transitionRequest(
  request: ServiceRequest,
  action: RequestAction,
  role: Role,
): ServiceRequest {
  if (request.cancelled) return request;
  switch (action.type) {
    case "cancel":
      return role === Role.Client && canCancelAsClient(request)
        ? { ...request, cancelled: true }
        : request;
    case "accept":
      return role === Role.Specialist && canClaim(request)
        ? {
            ...request,
            status: RequestStatus.Accepted,
            specialist:
              action.specialist ||
              request.specialist ||
              "Демо специалист · DOMORA",
          }
        : request;
    case "dismiss":
      return request;
    case "admin-assign":
      return role === Role.Admin && canClaim(request)
        ? {
            ...request,
            status: RequestStatus.Accepted,
            specialist: action.specialist,
          }
        : request;
    case "admin-recommend":
      return role === Role.Admin && canClaim(request)
        ? {
            ...request,
            recommendedSpecialistId: action.specialistId,
          }
        : request;
    case "advance": {
      if (role === Role.Client || !canAdvance(request)) return request;
      if (requiresCompletionReport(request.status) && !action.report?.trim())
        return request;
      const nextStatus: RequestStatus = nextExecutionStep(request.status);
      if (nextStatus === request.status) return request;
      return {
        ...request,
        status: nextStatus,
        specialist: request.specialist || "Демо специалист · DOMORA",
        ...(requiresCompletionReport(request.status)
          ? { report: action.report!.trim() }
          : {}),
      };
    }
    case "decline":
      return role !== Role.Client && request.status === RequestStatus.Created
        ? { ...request, specialist: undefined }
        : request;
    case "complete":
      return role === Role.Client && canConfirmCompletion(request)
        ? { ...request, status: RequestStatus.Completed }
        : request;
    case "issue":
      return role === Role.Client && canFlagIssue(request)
        ? { ...request, issue: true }
        : request;
    case "resolve":
      return role === Role.Admin && canResolveIssue(request)
        ? { ...request, issue: false }
        : request;
    case "rate":
      return role === Role.Client && canRate(request, action.rating)
        ? { ...request, rating: action.rating }
        : request;
  }
}
