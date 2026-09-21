import { describe, expect, it } from "vitest";
import { initialRequests } from "./demo-data";
import { transitionRequest } from "./transitions";
import type { ServiceRequest } from "./types";

const newRequest: ServiceRequest = {
  ...initialRequests[0],
  status: 0,
  specialist: undefined,
};

describe("request lifecycle", () => {
  it("requires a work report before client confirmation, then allows exactly one rating", () => {
    let request = transitionRequest(
      newRequest,
      { type: "advance" },
      "specialist",
    );
    expect(request.status).toBe(1);
    // Specialist advance skips status 2: moves directly from 1 to 3
    request = transitionRequest(request, { type: "advance" }, "specialist");
    expect(request.status).toBe(3);
    expect(
      transitionRequest(
        request,
        { type: "advance", report: "  " },
        "specialist",
      ),
    ).toBe(request);
    request = transitionRequest(
      request,
      { type: "advance", report: "  Ремонтът е готов.  " },
      "specialist",
    );
    expect(request.status).toBe(4);
    expect(request.report).toBe("Ремонтът е готов.");
    expect(transitionRequest(request, { type: "complete" }, "specialist")).toBe(
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

  it("handles specialist accept and dismiss actions", () => {
    expect(transitionRequest(newRequest, { type: "accept" }, "client")).toBe(
      newRequest,
    );
    expect(transitionRequest(newRequest, { type: "accept" }, "admin")).toBe(
      newRequest,
    );
    const accepted = transitionRequest(
      newRequest,
      { type: "accept", specialist: "Иван Иванов" },
      "specialist",
    );
    expect(accepted.status).toBe(1);
    expect(accepted.specialist).toBe("Иван Иванов");
    expect(transitionRequest(accepted, { type: "accept" }, "specialist")).toBe(
      accepted,
    );
    expect(
      transitionRequest(newRequest, { type: "dismiss" }, "specialist"),
    ).toBe(newRequest);
  });

  it("handles admin dispatch: direct assign and recommend", () => {
    expect(
      transitionRequest(
        newRequest,
        { type: "admin-assign", specialist: "Майстор Георги" },
        "specialist",
      ),
    ).toBe(newRequest);
    expect(
      transitionRequest(
        newRequest,
        { type: "admin-assign", specialist: "Майстор Георги" },
        "client",
      ),
    ).toBe(newRequest);

    const assigned = transitionRequest(
      newRequest,
      { type: "admin-assign", specialist: "Майстор Георги" },
      "admin",
    );
    expect(assigned.status).toBe(1);
    expect(assigned.specialist).toBe("Майстор Георги");

    expect(
      transitionRequest(
        newRequest,
        { type: "admin-recommend", specialistId: "spec-123" },
        "client",
      ),
    ).toBe(newRequest);

    const recommended = transitionRequest(
      newRequest,
      { type: "admin-recommend", specialistId: "spec-123" },
      "admin",
    );
    expect(recommended.status).toBe(0);
    expect(recommended.recommendedSpecialistId).toBe("spec-123");
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
      transitionRequest(completed, { type: "rate", rating: 5 }, "specialist"),
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
    expect(
      transitionRequest(cancelled, { type: "advance" }, "specialist"),
    ).toBe(cancelled);
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
