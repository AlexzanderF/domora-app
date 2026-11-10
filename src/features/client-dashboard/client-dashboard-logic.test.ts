import { describe, expect, it } from "vitest";
import type { ServiceRequest } from "@/domain/requests/types";
import {
  getRecentCompletedRequests,
  getTrackerControls,
  getTrackerSegments,
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
    actions: [],
  };
}

describe("client dashboard logic", () => {
  it("maps request statuses to the four tracker stages", () => {
    const statuses: ServiceRequest["status"][] = [
      "CREATED",
      "ACCEPTED",
      "IN_PROGRESS",
      "AWAITING_CONFIRMATION",
    ];
    expect(statuses.map(getTrackerStageIndex)).toEqual([0, 1, 2, 3]);
  });

  it("fills tracker segments up to and including the current stage", () => {
    expect(getTrackerSegments("CREATED")).toEqual([true, false, false, false]);
    expect(getTrackerSegments("IN_PROGRESS")).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(getTrackerSegments("AWAITING_CONFIRMATION")).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it("prioritizes a request waiting for client confirmation", () => {
    expect(
      selectActiveRequest([
        request(1, "ACCEPTED"),
        request(2, "AWAITING_CONFIRMATION"),
        request(3, "CREATED"),
      ])?.id,
    ).toBe(2);
  });

  it("returns no active request when all work is finished or cancelled", () => {
    expect(
      selectActiveRequest([
        request(1, "COMPLETED"),
        request(2, "ACCEPTED", true),
      ]),
    ).toBeNull();
  });

  it("returns at most three completed, non-cancelled requests", () => {
    expect(
      getRecentCompletedRequests([
        request(1, "COMPLETED"),
        request(2, "AWAITING_CONFIRMATION"),
        request(3, "COMPLETED", true),
        request(4, "COMPLETED"),
        request(5, "COMPLETED"),
        request(6, "COMPLETED"),
      ]).map(({ id }) => id),
    ).toEqual([1, 4, 5]);
  });
});

describe("tracker controls", () => {
  const withActions = (actions: ServiceRequest["actions"]) => ({
    ...request(1, "AWAITING_CONFIRMATION"),
    actions,
  });

  it("offers confirm and dispute only when the request allows them", () => {
    expect(
      getTrackerControls(withActions(["confirm", "dispute"]), false),
    ).toEqual({ confirm: true, dispute: true, rate: false });
  });

  it("hides the dispute control once a dispute is open", () => {
    expect(getTrackerControls(withActions(["confirm"]), false)).toEqual({
      confirm: true,
      dispute: false,
      rate: false,
    });
  });

  it("shows the rating only while open and still allowed", () => {
    expect(getTrackerControls(withActions(["rate"]), true).rate).toBe(true);
    expect(getTrackerControls(withActions(["rate"]), false).rate).toBe(false);
    expect(getTrackerControls(withActions([]), true).rate).toBe(false);
  });

  it("hides confirm and dispute while rating is open", () => {
    expect(
      getTrackerControls(withActions(["confirm", "dispute", "rate"]), true),
    ).toEqual({ confirm: false, dispute: false, rate: true });
  });
});
