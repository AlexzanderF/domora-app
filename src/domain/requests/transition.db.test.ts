import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { outboxEvents, requestEvents, requireDb } from "@/db";
import type { Actor } from "@/domain/authorization";
import {
  assignSpecialist,
  claimRequest,
  declineRecommendation,
  recommendRequest,
} from "@/domain/dispatch";
import { raiseDispute, resolveDispute } from "@/domain/disputes";
import { UserRole } from "@/domain/identity/types";
import {
  createActor,
  insertProfile,
  insertRequest,
} from "../../../tests/db/factories";
import {
  cancelRequest,
  confirmCompletion,
  rateRequest,
  releaseRequest,
  startWork,
  submitReport,
} from "./index";

let client: Actor;
let plumber: Actor;
let admin: Actor;

beforeEach(async () => {
  client = await createActor(UserRole.Client);
  plumber = await createActor(UserRole.Specialist);
  admin = await createActor(UserRole.Admin);
  await insertProfile(plumber.id, { category: "ВиК", area: "София" });
});

const open = () =>
  insertRequest({
    clientId: client.id,
    category: "0",
    address: "София, ул. Тест 1",
  });

async function auditTypes(requestId: number) {
  const rows = await requireDb()
    .select()
    .from(requestEvents)
    .where(eq(requestEvents.requestId, requestId))
    .orderBy(requestEvents.id);
  return rows.map((r) => r.type);
}

async function outboxTypes(requestId: number) {
  const rows = await requireDb()
    .select()
    .from(outboxEvents)
    .orderBy(outboxEvents.id);
  return rows
    .filter(
      (r) => (r.payload as { requestId?: number }).requestId === requestId,
    )
    .map((r) => r.type);
}

async function expectPaired(requestId: number, expected: string[]) {
  expect(await auditTypes(requestId)).toEqual(expected);
  expect(await outboxTypes(requestId)).toEqual(expected);
}

describe("request changes write one audit entry and one outbox event", () => {
  it("pairs every step of the happy path", async () => {
    const id = await open();
    await claimRequest(plumber, id);
    await startWork(plumber, id);
    await submitReport(plumber, id, "Готово");
    await raiseDispute(client, id, "Тече");
    await resolveDispute(admin, id, "Поправено");
    await confirmCompletion(client, id);
    await rateRequest(client, id, 5);

    await expectPaired(id, [
      "request.accepted",
      "request.started",
      "request.report_submitted",
      "request.dispute_raised",
      "request.dispute_resolved",
      "request.completed",
      "request.rated",
    ]);
  });

  it("pairs cancel and hand-back", async () => {
    const cancelled = await open();
    await cancelRequest(client, cancelled);
    await expectPaired(cancelled, ["request.cancelled"]);

    const handedBack = await open();
    await claimRequest(plumber, handedBack);
    await releaseRequest(plumber, handedBack);
    await expectPaired(handedBack, ["request.accepted", "request.released"]);
  });

  it("pairs admin dispatch", async () => {
    const assigned = await open();
    await assignSpecialist(admin, assigned, plumber.id);
    await expectPaired(assigned, ["request.assigned"]);

    const recommended = await open();
    await recommendRequest(admin, recommended, plumber.id);
    await declineRecommendation(plumber, recommended);
    await expectPaired(recommended, [
      "request.recommended",
      "request.recommendation_declined",
    ]);
  });
});
