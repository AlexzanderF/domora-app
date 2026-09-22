import { RequestStatus } from "@/features/requests/types";
import type { ServiceRequest } from "@/features/requests/types";

export const trackerStages = [
  "Създадена",
  "Приета",
  "В процес",
  "Очаква потвърждение",
] as const;

const TRACKER_INDEX: Record<RequestStatus, number> = {
  [RequestStatus.Created]: 0,
  [RequestStatus.Accepted]: 1,
  [RequestStatus.InProgress]: 2,
  [RequestStatus.AwaitingConfirmation]: 3,
  [RequestStatus.Completed]: 3,
};

export function getTrackerStageIndex(status: ServiceRequest["status"]) {
  return TRACKER_INDEX[status];
}

export function selectActiveRequest(requests: ServiceRequest[]) {
  const active = requests.filter(
    (request) =>
      !request.cancelled && request.status !== RequestStatus.Completed,
  );
  return (
    active.find(
      (request) => request.status === RequestStatus.AwaitingConfirmation,
    ) ??
    active.at(0) ??
    null
  );
}

export function getRecentCompletedRequests(requests: ServiceRequest[]) {
  return requests
    .filter(
      (request) =>
        request.status === RequestStatus.Completed && !request.cancelled,
    )
    .slice(0, 3);
}
