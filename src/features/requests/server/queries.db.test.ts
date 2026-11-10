import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "@/domain/authorization";
import { raiseDispute } from "@/domain/disputes";
import { UserRole } from "@/domain/identity/types";
import { RequestStatus } from "@/domain/requests/types";
import { createActor, insertRequest } from "../../../../tests/db/factories";
import { findClientRequests } from "./queries";

let client: Actor;
let specialist: Actor;
let requestId: number;

beforeEach(async () => {
  client = await createActor(UserRole.Client);
  specialist = await createActor(UserRole.Specialist);
  requestId = await insertRequest({
    clientId: client.id,
    specialistId: specialist.id,
    status: RequestStatus.AwaitingConfirmation,
  });
});

describe("client request actions", () => {
  it("offers confirm and dispute until a Dispute is open, then only confirm", async () => {
    const before = await findClientRequests(client);
    expect(before?.[0].actions).toEqual(["confirm", "dispute"]);

    await raiseDispute(client, requestId, "Течът остава");

    const after = await findClientRequests(client);
    expect(after?.[0].actions).toEqual(["confirm"]);
  });
});
