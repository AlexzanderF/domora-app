import type { RequestStatus, ServiceRequest } from "@/features/requests/types";

export const trackerStages = [
  "Създадена",
  "Приета",
  "В процес",
  "Очаква потвърждение",
] as const;

const TRACKER_INDEX: Record<Exclude<RequestStatus, "COMPLETED">, number> = {
  CREATED: 0,
  ACCEPTED: 1,
  IN_PROGRESS: 2,
  AWAITING_CONFIRMATION: 3,
};

export function getTrackerStageIndex(status: ServiceRequest["status"]) {
  if (status === "COMPLETED") return 3;
  return TRACKER_INDEX[status];
}

export function selectActiveRequest(requests: ServiceRequest[]) {
  const active = requests.filter(
    (request) => !request.cancelled && request.status !== "COMPLETED",
  );
  return (
    active.find((request) => request.status === "AWAITING_CONFIRMATION") ??
    active.at(0) ??
    null
  );
}

export function getRecentCompletedRequests(requests: ServiceRequest[]) {
  return requests
    .filter((request) => request.status === "COMPLETED" && !request.cancelled)
    .slice(0, 3);
}
