import type {
  RequestAction,
  RequestStatus,
  Role,
  ServiceRequest,
} from "./types";

// These guards keep the demo consistent. They are not server-side authorization.
export function transitionRequest(
  request: ServiceRequest,
  action: RequestAction,
  role: Role,
): ServiceRequest {
  if (request.cancelled) return request;
  switch (action.type) {
    case "cancel":
      return role === "client" && request.status < 4
        ? { ...request, cancelled: true }
        : request;
    case "accept":
      return role === "specialist" && request.status === 0
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
      return role === "admin" && request.status === 0
        ? {
            ...request,
            status: 1,
            specialist: action.specialist,
          }
        : request;
    case "admin-recommend":
      return role === "admin"
        ? {
            ...request,
            recommendedSpecialistId: action.specialistId,
          }
        : request;
    case "advance": {
      if (role === "client" || request.status >= 4) return request;
      if (request.status === 3 && !action.report?.trim()) return request;
      const nextStatus: RequestStatus =
        request.status === 1 || request.status === 2
          ? 3
          : ((request.status + 1) as RequestStatus);
      return {
        ...request,
        status: nextStatus,
        specialist: request.specialist || "Демо специалист · DOMORA",
        ...(request.status === 3 ? { report: action.report!.trim() } : {}),
      };
    }
    case "decline":
      return role !== "client" && request.status === 0
        ? { ...request, specialist: undefined }
        : request;
    case "complete":
      return role === "client" && request.status === 4
        ? { ...request, status: 5 }
        : request;
    case "issue":
      return role === "client" && request.status === 4
        ? { ...request, issue: true }
        : request;
    case "rate":
      return role === "client" &&
        request.status === 5 &&
        !request.rating &&
        Number.isInteger(action.rating) &&
        action.rating >= 1 &&
        action.rating <= 5
        ? { ...request, rating: action.rating }
        : request;
  }
}
