import { RequestStatus } from "@/domain/requests/types";
import type { ServiceRequest } from "@/domain/requests/types";

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

export function getTrackerSegments(status: ServiceRequest["status"]) {
  const stage = getTrackerStageIndex(status);
  return trackerStages.map((_, index) => index <= stage);
}

// Which request controls the tracker shows: only what the request's
// allowed actions offer; the rating prompt replaces confirm/dispute.
export function getTrackerControls(
  request: Pick<ServiceRequest, "actions">,
  ratingOpen: boolean,
) {
  const can = (kind: ServiceRequest["actions"][number]) =>
    request.actions.includes(kind);
  return {
    confirm: can("confirm") && !ratingOpen,
    dispute: can("dispute") && !ratingOpen,
    rate: can("rate") && ratingOpen,
  };
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
