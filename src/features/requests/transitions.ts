import type {
  RequestAction,
  RequestStatus,
  Role,
  ServiceRequest,
} from "./types";
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
      return role === "client" && canCancelAsClient(request)
        ? { ...request, cancelled: true }
        : request;
    case "accept":
      return role === "specialist" && canClaim(request)
        ? {
            ...request,
            status: 1,
            specialist:
              action.specialist ||
              request.specialist ||
              "Демо специалист · DOMORA",
          }
        : request;
    case "dismiss":
      return request;
    case "admin-assign":
      return role === "admin" && canClaim(request)
        ? {
            ...request,
            status: 1,
            specialist: action.specialist,
          }
        : request;
    case "admin-recommend":
      return role === "admin" && canClaim(request)
        ? {
            ...request,
            recommendedSpecialistId: action.specialistId,
          }
        : request;
    case "advance": {
      if (role === "client" || !canAdvance(request)) return request;
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
      return role !== "client" && request.status === 0
        ? { ...request, specialist: undefined }
        : request;
    case "complete":
      return role === "client" && canConfirmCompletion(request)
        ? { ...request, status: 5 }
        : request;
    case "issue":
      return role === "client" && canFlagIssue(request)
        ? { ...request, issue: true }
        : request;
    case "resolve":
      return role === "admin" && canResolveIssue(request)
        ? { ...request, issue: false }
        : request;
    case "rate":
      return role === "client" && canRate(request, action.rating)
        ? { ...request, rating: action.rating }
        : request;
  }
}
