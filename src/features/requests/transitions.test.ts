import { describe, expect, it } from "vitest";
import { initialRequests } from "./demo-data";
import { transitionRequest } from "./transitions";
import type { ServiceRequest } from "./types";

const newRequest: ServiceRequest = {
  ...initialRequests[0],
  status: 0,
  master: undefined,
};

describe("request lifecycle", () => {
  it("requires a work report before client confirmation, then allows exactly one rating", () => {
    let request = transitionRequest(newRequest, { type: "advance" }, "master");
    expect(request.status).toBe(1);
    request = transitionRequest(request, { type: "advance" }, "master");
    request = transitionRequest(request, { type: "advance" }, "master");
    expect(request.status).toBe(3);
    expect(
      transitionRequest(request, { type: "advance", report: "  " }, "master"),
    ).toBe(request);
    request = transitionRequest(
      request,
      { type: "advance", report: "  Ремонтът е готов.  " },
      "master",
    );
    expect(request.status).toBe(4);
    expect(request.report).toBe("Ремонтът е готов.");
    expect(transitionRequest(request, { type: "complete" }, "master")).toBe(
      request,
    );
    request = transitionRequest(request, { type: "complete" }, "client");
    request = transitionRequest(request, { type: "rate", rating: 5 }, "client");
    expect(request.rating).toBe(5);
    expect(
      transitionRequest(request, { type: "rate", rating: 1 }, "client"),
    ).toBe(request);
    expect(newRequest.status).toBe(0);
  });

  it("prevents clients from advancing work and staff from cancelling or rating it", () => {
    expect(transitionRequest(newRequest, { type: "advance" }, "client")).toBe(
      newRequest,
    );
    expect(transitionRequest(newRequest, { type: "cancel" }, "admin")).toBe(
      newRequest,
    );
    const completed: ServiceRequest = { ...newRequest, status: 5 };
    expect(
      transitionRequest(completed, { type: "rate", rating: 5 }, "master"),
    ).toBe(completed);
  });

  it("makes cancellation terminal and rejects premature completion and rating", () => {
    expect(transitionRequest(newRequest, { type: "complete" }, "client")).toBe(
      newRequest,
    );
    expect(
      transitionRequest(newRequest, { type: "rate", rating: 5 }, "client"),
    ).toBe(newRequest);
    const cancelled = transitionRequest(
      newRequest,
      { type: "cancel" },
      "client",
    );
    expect(cancelled.cancelled).toBe(true);
    expect(transitionRequest(cancelled, { type: "advance" }, "master")).toBe(
      cancelled,
    );
    expect(cancelled.price).toBe(newRequest.price);
  });

  it("allows an issue only while awaiting confirmation and rejects invalid ratings", () => {
    expect(transitionRequest(newRequest, { type: "issue" }, "client")).toBe(
      newRequest,
    );
    expect(
      transitionRequest(initialRequests[1], { type: "issue" }, "client").issue,
    ).toBe(true);
    const completed: ServiceRequest = { ...newRequest, status: 5 };
    for (const rating of [0, 6, 2.5, NaN])
      expect(
        transitionRequest(completed, { type: "rate", rating }, "client"),
      ).toBe(completed);
  });
});
