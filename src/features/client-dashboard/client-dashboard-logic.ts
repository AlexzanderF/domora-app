import type { ServiceRequest } from "@/features/requests/types";

export const trackerStages = [
  "Създадена",
  "Приета",
  "В процес",
  "Очаква потвърждение",
] as const;

export function getTrackerStageIndex(status: ServiceRequest["status"]) {
  if (status === 0) return 0;
  if (status === 1) return 1;
  if (status === 2 || status === 3) return 2;
  return 3;
}

export function selectActiveRequest(requests: ServiceRequest[]) {
  const active = requests.filter(
    (request) => !request.cancelled && request.status <= 4,
  );
  return active.find((request) => request.status === 4) ?? active.at(0) ?? null;
}

export function getRecentCompletedRequests(requests: ServiceRequest[]) {
  return requests
    .filter((request) => request.status === 5 && !request.cancelled)
    .slice(0, 3);
}
