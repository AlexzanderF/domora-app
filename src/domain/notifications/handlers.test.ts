import { describe, expect, it } from "vitest";
import { eventHandlers } from "./handlers";

describe("worker handler map", () => {
  it("decides every event type: a handler function or an explicit null", () => {
    const expected = [
      "request.created",
      "request.accepted",
      "request.recommended",
      "request.report_submitted",
      "request.completed",
      "request.dispute_raised",
      "request.dispute_resolved",
      "specialist.registered",
      "specialist.approved",
      "specialist.rejected",
      "password.reset_requested",
      "password.reset_completed",
      "account.client_registered",
      "account.profile_updated",
      "tariffs.updated",
    ].sort();
    expect(Object.keys(eventHandlers).sort()).toEqual(expected);
    for (const handler of Object.values(eventHandlers)) {
      expect(handler === null || typeof handler === "function").toBe(true);
    }
  });

  it("handles Dispute events in the request flow", () => {
    expect(eventHandlers["request.dispute_raised"]).toBeTypeOf("function");
    expect(eventHandlers["request.dispute_resolved"]).toBeTypeOf("function");
  });
});
