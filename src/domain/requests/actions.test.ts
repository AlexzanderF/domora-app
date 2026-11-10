import { describe, expect, it } from "vitest";
import type { Actor } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { RequestStatus } from "@/domain/requests/types";
import { availableActions } from "./actions";
import type { ActionSubject } from "./actions";

const CLIENT = 1;
const SPECIALIST = 2;
const OTHER = 3;

const actors = {
  client: { id: CLIENT, role: UserRole.Client, status: UserStatus.Active },
  otherClient: { id: OTHER, role: UserRole.Client, status: UserStatus.Active },
  specialist: {
    id: SPECIALIST,
    role: UserRole.Specialist,
    status: UserStatus.Active,
  },
  otherSpecialist: {
    id: OTHER,
    role: UserRole.Specialist,
    status: UserStatus.Active,
  },
  pending: {
    id: SPECIALIST,
    role: UserRole.Specialist,
    status: UserStatus.Pending,
  },
  rejected: {
    id: SPECIALIST,
    role: UserRole.Specialist,
    status: UserStatus.Rejected,
  },
  admin: { id: 99, role: UserRole.Admin, status: UserStatus.Active },
} satisfies Record<string, Actor>;

function request(overrides: Partial<ActionSubject> = {}): ActionSubject {
  return {
    clientId: CLIENT,
    specialistId: null,
    recommendedSpecialistId: null,
    status: RequestStatus.Created,
    cancelled: false,
    issue: false,
    rating: null,
    ...overrides,
  };
}

const accepted = { status: RequestStatus.Accepted, specialistId: SPECIALIST };
const inProgress = {
  status: RequestStatus.InProgress,
  specialistId: SPECIALIST,
};
const awaiting = {
  status: RequestStatus.AwaitingConfirmation,
  specialistId: SPECIALIST,
};
const completed = { status: RequestStatus.Completed, specialistId: SPECIALIST };

type Case = [string, Partial<ActionSubject>, string[]];

describe("availableActions: client", () => {
  const cases: Case[] = [
    ["open request", {}, ["cancel"]],
    ["accepted", accepted, ["cancel"]],
    ["in progress", inProgress, ["cancel"]],
    ["awaiting confirmation", awaiting, ["confirm", "dispute"]],
    [
      "awaiting confirmation with an open dispute",
      { ...awaiting, issue: true },
      ["confirm"],
    ],
    ["completed, unrated", completed, ["rate"]],
    ["completed and rated", { ...completed, rating: 4 }, []],
    ["cancelled open request", { cancelled: true }, []],
    ["cancelled accepted request", { ...accepted, cancelled: true }, []],
  ];
  it.each(cases)("%s", (_name, overrides, expected) => {
    expect(availableActions(actors.client, request(overrides))).toEqual(
      expected,
    );
  });

  it("gets nothing on another client's request", () => {
    expect(availableActions(actors.otherClient, request(awaiting))).toEqual([]);
  });
});

describe("availableActions: specialist", () => {
  const cases: Case[] = [
    ["open request", {}, ["claim"]],
    [
      "open request recommended to them",
      { recommendedSpecialistId: SPECIALIST },
      ["claim", "declineRecommendation"],
    ],
    [
      "open request recommended to someone else",
      { recommendedSpecialistId: OTHER },
      ["claim"],
    ],
    ["accepted by them", accepted, ["release", "start"]],
    ["in progress", inProgress, ["submitReport"]],
    ["awaiting confirmation", awaiting, []],
    ["completed", completed, []],
    ["cancelled open request", { cancelled: true }, []],
    ["cancelled accepted request", { ...accepted, cancelled: true }, []],
    [
      "accepted by another specialist",
      { ...accepted, specialistId: OTHER },
      [],
    ],
  ];
  it.each(cases)("%s", (_name, overrides, expected) => {
    expect(availableActions(actors.specialist, request(overrides))).toEqual(
      expected,
    );
  });

  it("another specialist cannot work a request assigned elsewhere", () => {
    expect(availableActions(actors.otherSpecialist, request(accepted))).toEqual(
      [],
    );
  });

  it.each(["pending", "rejected"] as const)(
    "a %s specialist gets nothing",
    (who) => {
      expect(availableActions(actors[who], request())).toEqual([]);
      expect(availableActions(actors[who], request(accepted))).toEqual([]);
    },
  );
});

// The admin's action set follows the authorization policy, so tightening the
// policy tightens it here; these cases pin only the parts that are stable.
describe("availableActions: admin", () => {
  it("can cancel, assign and recommend an open request", () => {
    expect(availableActions(actors.admin, request())).toEqual(
      expect.arrayContaining(["cancel", "assign", "recommend"]),
    );
  });

  it("cannot assign, recommend or cancel a cancelled request", () => {
    expect(
      availableActions(actors.admin, request({ cancelled: true })),
    ).toEqual([]);
  });

  it("cannot assign or recommend an assigned request", () => {
    const actions = availableActions(actors.admin, request(accepted));
    expect(actions).not.toContain("assign");
    expect(actions).not.toContain("recommend");
    expect(actions).toContain("cancel");
  });

  it("resolves a dispute only while one is open", () => {
    expect(availableActions(actors.admin, request(awaiting))).not.toContain(
      "resolveDispute",
    );
    expect(
      availableActions(actors.admin, request({ ...awaiting, issue: true })),
    ).toContain("resolveDispute");
  });

  it("never disputes on a client's behalf", () => {
    expect(availableActions(actors.admin, request(awaiting))).not.toContain(
      "dispute",
    );
  });

  it("cannot hand back", () => {
    expect(availableActions(actors.admin, request(accepted))).not.toContain(
      "release",
    );
  });
});
