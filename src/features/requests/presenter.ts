import type { ActionKind } from "@/domain/requests/actions";
import type {
  AdminRequest,
  ClientRequest,
  RequestDto,
} from "@/domain/requests";
import type { CategoryId, ServiceRequest } from "@/domain/requests/types";

// The one place a domain request becomes the UI view model: display values and
// the visit date, falling back to the creation date for rows that predate it.
export function presentClientRequest(request: ClientRequest): ServiceRequest {
  const rawCategory = Number(request.category);
  const category: CategoryId =
    rawCategory >= 0 && rawCategory <= 5 ? (rawCategory as CategoryId) : 0;
  const created = new Date(request.createdAt);

  return {
    id: request.id,
    category,
    service: request.title,
    address: request.address,
    date: request.scheduledDate ?? request.createdAt.split("T")[0],
    time:
      request.scheduledTime ??
      created.toLocaleTimeString("bg-BG", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    price: request.price,
    status: request.status,
    description: request.description,
    cancelled: request.cancelled,
    report: request.report ?? undefined,
    reportPhotoIds: request.reportPhotoIds,
    rating: request.rating ?? undefined,
    issue: request.issue || undefined,
    issueNote: request.issueNote ?? undefined,
    specialist: request.specialistName ?? undefined,
    specialistPhone: request.specialistPhone ?? undefined,
    actions: request.actions,
  };
}

// The admin view of a request: the same view model plus the dispatch fields.
export function presentAdminRequest(request: AdminRequest): ServiceRequest {
  return {
    ...presentClientRequest(request),
    priority: request.priority,
    recommendedSpecialistId: request.recommendedSpecialistId ?? undefined,
    dispatchedByAdmin: request.dispatchedByAdmin || undefined,
    clientName: request.clientName ?? undefined,
    clientPhone: request.clientPhone,
  };
}

// A request as the specialist sees it: an agenda entry or a job opportunity.
export function presentSpecialistRequest(
  request: RequestDto & { actions: ActionKind[]; clientName?: string | null },
): ServiceRequest {
  return presentAdminRequest({
    specialistName: null,
    specialistPhone: null,
    reportPhotoIds: [],
    clientName: null,
    ...request,
  });
}
