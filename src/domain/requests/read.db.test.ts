import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "@/domain/authorization";
import { raiseDispute } from "@/domain/disputes";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { RequestStatus } from "@/domain/requests/types";
import { createActor, insertRequest } from "../../../tests/db/factories";
import { listClientRequests } from "./read";

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
