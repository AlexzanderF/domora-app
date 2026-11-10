import { describe, expect, it } from "vitest";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { can, type Action, type Actor, type RequestResource } from "./index";

const ALL_ACTIONS: readonly Action[] = [
  "request.create",
  "request.view",
  "request.claim",
  "request.work",
  "request.cancel",
  "request.release",
  "request.confirm",
  "request.rate",
  "request.assign",
  "request.dispute",
  "request.resolve_dispute",
  "request.attach_photo",
  "request.attach_report_photo",
  "request.view_photo",
];

const ACTOR_ID = 7;
const OTHER_ID = 99;

const actors: Record<string, Actor> = {
  client: { id: ACTOR_ID, role: UserRole.Client, status: UserStatus.Active },
  activeSpecialist: {
    id: ACTOR_ID,
    role: UserRole.Specialist,
    status: UserStatus.Active,
  },
  pendingSpecialist: {
    id: ACTOR_ID,
    role: UserRole.Specialist,
    status: UserStatus.Pending,
  },
  rejectedSpecialist: {
    id: ACTOR_ID,
    role: UserRole.Specialist,
    status: UserStatus.Rejected,
  },
  admin: { id: ACTOR_ID, role: UserRole.Admin, status: UserStatus.Active },
};

// Resource shapes relative to the actor.
const resources: Record<string, RequestResource> = {
  // The actor is both the client who owns it and the specialist assigned to it.
  ownedAndAssigned: { clientId: ACTOR_ID, specialistId: ACTOR_ID },
  // Someone else's request, assigned to someone else.
  foreign: { clientId: OTHER_ID, specialistId: OTHER_ID },
  // Someone else's request that nobody has claimed yet.
  foreignUnassigned: { clientId: OTHER_ID, specialistId: null },
  // The actor owns it as a client; a different specialist is assigned.
  ownedOnly: { clientId: ACTOR_ID, specialistId: OTHER_ID },
  // The actor is assigned as specialist; a different client owns it.
  assignedOnly: { clientId: OTHER_ID, specialistId: ACTOR_ID },
};

// Only the request's client raises a dispute or attaches booking photos; only
// its assigned specialist attaches report photos; only an admin resolves a
// dispute.
const NEVER_ADMIN: readonly Action[] = [
  "request.release",
  "request.dispute",
  "request.attach_photo",
  "request.attach_report_photo",
];
const ADMIN_ACTIONS = ALL_ACTIONS.filter(
  (a) => a !== "request.create" && !NEVER_ADMIN.includes(a),
);

type Allowed = Partial<Record<keyof typeof resources, readonly Action[]>>;

// Explicit expectation: for each actor, the actions allowed on each resource.
// Anything not listed must be denied.
const expectations: Record<keyof typeof actors, Allowed> = {
  client: {
    ownedAndAssigned: [
      "request.view",
      "request.cancel",
      "request.confirm",
      "request.rate",
      "request.dispute",
      "request.attach_photo",
      "request.view_photo",
    ],
    ownedOnly: [
      "request.view",
      "request.cancel",
      "request.confirm",
      "request.rate",
      "request.dispute",
      "request.attach_photo",
      "request.view_photo",
    ],
  },
  activeSpecialist: {
    ownedAndAssigned: [
      "request.view",
      "request.work",
      "request.release",
      "request.attach_report_photo",
      "request.view_photo",
    ],
    assignedOnly: [
      "request.view",
      "request.work",
      "request.release",
      "request.attach_report_photo",
      "request.view_photo",
    ],
    foreignUnassigned: ["request.view", "request.claim"],
  },
  pendingSpecialist: {},
  rejectedSpecialist: {},
  admin: {
    ownedAndAssigned: ADMIN_ACTIONS,
    foreign: ADMIN_ACTIONS,
    foreignUnassigned: ADMIN_ACTIONS,
    ownedOnly: ADMIN_ACTIONS,
    assignedOnly: ADMIN_ACTIONS,
  },
};

const canCreate: Record<keyof typeof actors, boolean> = {
  client: true,
  activeSpecialist: false,
  pendingSpecialist: false,
  rejectedSpecialist: false,
  admin: true,
};

describe("can() policy matrix", () => {
  for (const [actorName, actor] of Object.entries(actors)) {
    describe(actorName, () => {
      for (const [resourceName, resource] of Object.entries(resources)) {
        for (const action of ALL_ACTIONS) {
          if (action === "request.create") continue;
          const allowed = (
            expectations[actorName][resourceName] ?? []
          ).includes(action);
          it(`${allowed ? "allows" : "denies"} ${action} on ${resourceName}`, () => {
            expect(can(actor, action, resource)).toBe(allowed);
          });
        }
      }

      it(`${canCreate[actorName] ? "allows" : "denies"} request.create`, () => {
        expect(can(actor, "request.create")).toBe(canCreate[actorName]);
      });

      it("denies resource-bound actions when no resource is given", () => {
        for (const action of ALL_ACTIONS) {
          if (action === "request.create") continue;
          expect(can(actor, action)).toBe(
            actorName === "admin" && !NEVER_ADMIN.includes(action),
          );
        }
      });
    });
  }
});
