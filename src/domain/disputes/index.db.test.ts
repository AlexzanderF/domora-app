import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { requestEvents, requireDb, requests } from "@/db";
import type { Actor } from "@/domain/authorization";
import { UserRole } from "@/domain/identity/types";
import { RequestStatus } from "@/domain/requests/types";
import { createActor, insertRequest } from "../../../tests/db/factories";
import { getDisputeHistory, raiseDispute, resolveDispute } from "./index";

let client: Actor;
let otherClient: Actor;
let specialist: Actor;
let otherSpecialist: Actor;
let admin: Actor;
let requestId: number;

beforeEach(async () => {
  client = await createActor(UserRole.Client);
  otherClient = await createActor(UserRole.Client);
  specialist = await createActor(UserRole.Specialist);
  otherSpecialist = await createActor(UserRole.Specialist);
  admin = await createActor(UserRole.Admin);
  requestId = await insertRequest({
    clientId: client.id,
    specialistId: specialist.id,
    status: RequestStatus.AwaitingConfirmation,
    report: "Готово",
  });
});

async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (error: { code?: string }) => error.code ?? "UNKNOWN",
  );
}

async function requestRow() {
  const [row] = await requireDb()
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));
  return row;
}

describe("raiseDispute", () => {
  it("stores the note, flags the request and audits it", async () => {
    const dispute = await raiseDispute(client, requestId, "  Течът остава  ");

    expect(dispute).toMatchObject({
      requestId,
      note: "Течът остава",
      raisedById: client.id,
      resolvedAt: null,
    });
    const row = await requestRow();
    expect(row.issue).toBe(true);
    expect(row.issueNote).toBe("Течът остава");
    expect(row.issueOpenedAt).toBeInstanceOf(Date);
    const events = await requireDb()
      .select()
      .from(requestEvents)
      .where(eq(requestEvents.requestId, requestId));
    expect(events.map((e) => e.type)).toEqual(["request.dispute_raised"]);
  });

  it("is visible to the assigned specialist and admins, not strangers", async () => {
    await raiseDispute(client, requestId, "Течът остава");

    expect((await getDisputeHistory(specialist, requestId))[0].note).toBe(
      "Течът остава",
    );
    expect((await getDisputeHistory(admin, requestId))[0].note).toBe(
      "Течът остава",
    );
    expect((await getDisputeHistory(client, requestId)).length).toBe(1);
    expect(await rejection(getDisputeHistory(otherSpecialist, requestId))).toBe(
      "FORBIDDEN",
    );
    expect(await rejection(getDisputeHistory(otherClient, requestId))).toBe(
      "FORBIDDEN",
    );
  });

  it("rejects everyone but the request's client", async () => {
    for (const actor of [otherClient, specialist, otherSpecialist, admin]) {
      expect(await rejection(raiseDispute(actor, requestId, "Проблем"))).toBe(
        "FORBIDDEN",
      );
    }
    expect(await rejection(raiseDispute(null, requestId, "Проблем"))).toBe(
      "UNAUTHENTICATED",
    );
    expect((await requestRow()).issue).toBe(false);
  });

  it("requires a note", async () => {
    expect(await rejection(raiseDispute(client, requestId, "   "))).toBe(
      "INVALID_INPUT",
    );
  });

  it("is idempotent while a dispute is open", async () => {
    const first = await raiseDispute(client, requestId, "Първи");
    const again = await raiseDispute(client, requestId, "Втори");

    expect(again.id).toBe(first.id);
    expect(again.note).toBe("Първи");
    expect(await getDisputeHistory(client, requestId)).toHaveLength(1);
    const events = await requireDb()
      .select()
      .from(requestEvents)
      .where(eq(requestEvents.requestId, requestId));
    expect(events).toHaveLength(1);
  });

  it("rejects a note over the length limit", async () => {
    expect(
      await rejection(raiseDispute(client, requestId, "x".repeat(2001))),
    ).toBe("INVALID_INPUT");
  });

  it("only applies to work awaiting confirmation", async () => {
    const inProgress = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.InProgress,
    });
    expect(await rejection(raiseDispute(client, inProgress, "Рано"))).toBe(
      "INVALID_STATE",
    );
  });

  it("answers NOT_FOUND for a missing request", async () => {
    expect(await rejection(raiseDispute(client, 999999, "Проблем"))).toBe(
      "NOT_FOUND",
    );
  });
});

describe("resolveDispute", () => {
  it("lets an admin resolve and keeps the dispute history", async () => {
    await raiseDispute(client, requestId, "Течът остава");

    const resolved = await resolveDispute(admin, requestId, "Поправено");

    expect(resolved).toMatchObject({
      note: "Течът остава",
      resolvedById: admin.id,
      resolutionNote: "Поправено",
    });
    expect(resolved.resolvedAt).not.toBeNull();
    const row = await requestRow();
    expect(row.issue).toBe(false);
    const history = await getDisputeHistory(admin, requestId);
    expect(history).toHaveLength(1);
    expect(history[0].note).toBe("Течът остава");
    const types = (
      await requireDb()
        .select()
        .from(requestEvents)
        .where(eq(requestEvents.requestId, requestId))
        .orderBy(requestEvents.id)
    ).map((e) => e.type);
    expect(types).toEqual([
      "request.dispute_raised",
      "request.dispute_resolved",
    ]);
  });

  it("accumulates history across repeated disputes", async () => {
    await raiseDispute(client, requestId, "Първи");
    await resolveDispute(admin, requestId);
    await raiseDispute(client, requestId, "Втори");
    await resolveDispute(admin, requestId, "Готово");

    const history = await getDisputeHistory(client, requestId);
    expect(history.map((d) => d.note)).toEqual(["Втори", "Първи"]);
    expect(history.every((d) => d.resolvedAt !== null)).toBe(true);
  });

  it("rejects everyone but an admin", async () => {
    await raiseDispute(client, requestId, "Проблем");
    for (const actor of [client, otherClient, specialist, otherSpecialist]) {
      expect(await rejection(resolveDispute(actor, requestId))).toBe(
        "FORBIDDEN",
      );
    }
    expect(await rejection(resolveDispute(null, requestId))).toBe(
      "UNAUTHENTICATED",
    );
    expect((await requestRow()).issue).toBe(true);
  });

  it("records an issue flagged before disputes were stored", async () => {
    const legacy = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.AwaitingConfirmation,
      issue: true,
      issueNote: "Старо оплакване",
    });

    await resolveDispute(admin, legacy);

    const history = await getDisputeHistory(admin, legacy);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      note: "Старо оплакване",
      resolvedById: admin.id,
    });
  });

  it("rejects resolving when nothing is open", async () => {
    expect(await rejection(resolveDispute(admin, requestId))).toBe(
      "INVALID_STATE",
    );
  });
});
