import { describe, expect, it } from "vitest";
import type { ClientRequest } from "@/domain/requests";
import { RequestPriority, RequestStatus } from "@/domain/requests/types";
import { presentClientRequest } from "./presenter";

const base: ClientRequest = {
  id: 1,
  clientId: 2,
  specialistId: null,
  title: "Смяна на кран",
  description: "Тече кранът",
  category: "3",
  address: "София",
  priority: RequestPriority.Standard,
  status: RequestStatus.Created,
  price: 45,
  clientPhone: "0888000000",
  scheduledDate: "2030-05-17",
  scheduledTime: "09:00 - 12:00",
  cancelled: false,
  report: null,
  rating: null,
  issue: false,
  issueNote: null,
  recommendedSpecialistId: null,
  dispatchedByAdmin: false,
  subscriptionId: null,
  reportSubmittedAt: null,
  completedAt: null,
  ratedAt: null,
  issueOpenedAt: null,
  createdAt: "2030-01-02T10:30:00.000Z",
  updatedAt: "2030-01-02T10:30:00.000Z",
  specialistName: null,
  specialistPhone: null,
  reportPhotoIds: [],
  actions: ["cancel"],
};

describe("presentClientRequest", () => {
  it("shows the visit date and time window", () => {
    const view = presentClientRequest(base);
    expect(view.date).toBe("2030-05-17");
    expect(view.time).toBe("09:00 - 12:00");
    expect(view.category).toBe(3);
    expect(view.actions).toEqual(["cancel"]);
  });

  it("falls back to the creation date when there is no visit date", () => {
    const view = presentClientRequest({
      ...base,
      scheduledDate: null,
      scheduledTime: null,
    });
    expect(view.date).toBe("2030-01-02");
    expect(view.time).toMatch(/\d{2}:\d{2}/);
  });
});
