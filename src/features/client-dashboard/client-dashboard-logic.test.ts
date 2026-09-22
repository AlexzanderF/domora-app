import { describe, expect, it } from "vitest";
import type { ServiceRequest } from "@/features/requests/types";
import {
  getRecentCompletedRequests,
  getTrackerStageIndex,
  selectActiveRequest,
} from "./client-dashboard-logic";

function request(
  id: number,
  status: ServiceRequest["status"],
  cancelled = false,
): ServiceRequest {
  return {
    id,
    status,
    cancelled,
    category: 0,
    service: `Услуга ${id}`,
    address: "София",
    date: "2026-09-22",
    time: "09:00–12:00",
    price: 45,
    description: "Тестова заявка",
  };
}

describe("client dashboard logic", () => {
  it("maps request statuses to the four tracker stages", () => {
    const statuses: ServiceRequest["status"][] = [0, 1, 2, 3, 4];
    expect(statuses.map(getTrackerStageIndex)).toEqual([0, 1, 2, 2, 3]);
  });

  it("prioritizes a request waiting for client confirmation", () => {
    expect(
      selectActiveRequest([request(1, 1), request(2, 4), request(3, 0)])?.id,
    ).toBe(2);
  });

  it("returns no active request when all work is finished or cancelled", () => {
    expect(
      selectActiveRequest([request(1, 5), request(2, 1, true)]),
    ).toBeNull();
  });

  it("returns at most three completed, non-cancelled requests", () => {
    expect(
      getRecentCompletedRequests([
        request(1, 5),
        request(2, 4),
        request(3, 5, true),
        request(4, 5),
        request(5, 5),
        request(6, 5),
      ]).map(({ id }) => id),
    ).toEqual([1, 4, 5]);
  });
});
