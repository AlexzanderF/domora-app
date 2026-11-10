import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "@/domain/authorization";
import { raiseDispute } from "@/domain/disputes";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { RequestStatus } from "@/domain/requests/types";
import { createActor, insertRequest } from "../../../tests/db/factories";
import {
  listAgenda,
  listAll,
  listClientRequests,
  listTriage,
  specialistSummary,
} from "./read";

let client: Actor;
let otherClient: Actor;
let specialist: Actor;

beforeEach(async () => {
  client = await createActor(UserRole.Client);
  otherClient = await createActor(UserRole.Client);
  specialist = await createActor(UserRole.Specialist);
});

describe("listClientRequests", () => {
  it("returns only the client's own requests, newest first", async () => {
    const first = await insertRequest({ clientId: client.id });
    await insertRequest({ clientId: otherClient.id });
    const second = await insertRequest({ clientId: client.id });

    const list = await listClientRequests(client);

    expect(list.map((r) => r.id)).toEqual([second, first]);
  });

  it("carries the visit date and the creation date for the presenter fallback", async () => {
    await insertRequest({
      clientId: client.id,
      scheduledDate: "2030-05-17",
      scheduledTime: "09:00 - 12:00",
    });
    await insertRequest({ clientId: client.id });

    const [legacy, booked] = await listClientRequests(client);

    expect(booked.scheduledDate).toBe("2030-05-17");
    expect(booked.scheduledTime).toBe("09:00 - 12:00");
    expect(legacy.scheduledDate).toBeNull();
    expect(legacy.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("names the assigned specialist", async () => {
    await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
    });

    const [request] = await listClientRequests(client);

    expect(request.specialistName).toMatch(/^Test SPECIALIST/i);
    expect(request.specialistPhone).toBe("0888000000");
  });

  it("offers confirm and dispute until a Dispute is open, then only confirm", async () => {
    const requestId = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.AwaitingConfirmation,
    });
    const [before] = await listClientRequests(client);
    expect(before.actions).toEqual(["confirm", "dispute"]);

    await raiseDispute(client, requestId, "Течът остава");

    const [after] = await listClientRequests(client);
    expect(after.actions).toEqual(["confirm"]);
  });

  it("refuses non-clients and unauthenticated visitors", async () => {
    const pending = await createActor(UserRole.Specialist, UserStatus.Pending);
    await expect(listClientRequests(specialist)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(listClientRequests(pending)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(listClientRequests(null)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });
});

describe("admin reads", () => {
  let admin: Actor;
  beforeEach(async () => {
    admin = await createActor(UserRole.Admin);
  });

  it("refuses non-Administrators", async () => {
    for (const actor of [client, specialist]) {
      await expect(listAll(actor)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(listTriage(actor, "unassigned")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(listTriage(actor, "disputed")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    }
  });

  it("listAll returns every request newest first with client name and visit date", async () => {
    const first = await insertRequest({ clientId: client.id });
    const second = await insertRequest({
      clientId: otherClient.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
      scheduledDate: "2030-05-17",
    });

    const list = await listAll(admin);

    expect(list.map((r) => r.id)).toEqual([second, first]);
    expect(list[0].scheduledDate).toBe("2030-05-17");
    expect(list[0].specialistName).toBeTruthy();
    expect(list[1].clientName).toBeTruthy();
    expect(list[1].actions).toEqual(
      expect.arrayContaining(["cancel", "assign"]),
    );
  });

  it("unassigned triage is claimable requests only, urgent first", async () => {
    const standard = await insertRequest({ clientId: client.id });
    const urgent = await insertRequest({
      clientId: client.id,
      priority: "URGENT",
    });
    await insertRequest({ clientId: client.id, cancelled: true });
    await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
    });

    const list = await listTriage(admin, "unassigned");

    expect(list.map((r) => r.id)).toEqual([urgent, standard]);
  });

  it("disputed triage lists open disputes with the client's note", async () => {
    const id = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.AwaitingConfirmation,
    });
    await raiseDispute(client, id, "Течът остава");

    const list = await listTriage(admin, "disputed");

    expect(list.map((r) => [r.id, r.issueNote])).toEqual([
      [id, "Течът остава"],
    ]);
  });
});

describe("listAgenda", () => {
  it("shows the specialist only their own accepted and in-flight requests", async () => {
    const accepted = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
    });
    const inProgress = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.InProgress,
    });
    await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Completed,
    });
    await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
      cancelled: true,
    });
    await insertRequest({ clientId: client.id });
    const other = await createActor(UserRole.Specialist);
    await insertRequest({
      clientId: client.id,
      specialistId: other.id,
      status: RequestStatus.Accepted,
    });

    const agenda = await listAgenda(specialist);

    expect(agenda.map((r) => r.id)).toEqual([inProgress, accepted]);
    expect(agenda[1].clientName).toMatch(/^Test CLIENT/i);
    expect(agenda[1].actions).toEqual(["release", "start"]);
  });

  it("shows nothing to Pending or Rejected specialists, admins and clients", async () => {
    const pending = await createActor(UserRole.Specialist, UserStatus.Pending);
    const rejected = await createActor(
      UserRole.Specialist,
      UserStatus.Rejected,
    );
    const admin = await createActor(UserRole.Admin);
    for (const assignee of [pending, rejected]) {
      await insertRequest({
        clientId: client.id,
        specialistId: assignee.id,
        status: RequestStatus.Accepted,
      });
    }

    expect(await listAgenda(pending)).toEqual([]);
    expect(await listAgenda(rejected)).toEqual([]);
    expect(await listAgenda(admin)).toEqual([]);
    expect(await listAgenda(client)).toEqual([]);
    await expect(listAgenda(null)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });
});

describe("specialistSummary", () => {
  it("counts active jobs and the earnings of visits completed today", async () => {
    await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.InProgress,
    });
    await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Completed,
      scheduledDate: "2030-05-17",
      price: 60,
    });
    await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Completed,
      scheduledDate: "2030-05-16",
      price: 99,
    });

    expect(await specialistSummary(specialist, "2030-05-17")).toEqual({
      activeJobs: 1,
      todaysEarnings: 60,
    });
  });
});
