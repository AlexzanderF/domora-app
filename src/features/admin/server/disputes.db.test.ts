import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "@/domain/authorization";
import { raiseDispute, resolveDispute } from "@/domain/disputes";
import { UserRole } from "@/domain/identity/types";
import { RequestStatus } from "@/domain/requests/types";
import { createActor, insertRequest } from "../../../../tests/db/factories";
import { findResolvedDisputesForAdmin } from "./queries";

let client: Actor;
let specialist: Actor;
let admin: Actor;
let requestId: number;

beforeEach(async () => {
  client = await createActor(UserRole.Client);
  specialist = await createActor(UserRole.Specialist);
  admin = await createActor(UserRole.Admin);
  requestId = await insertRequest({
    clientId: client.id,
    specialistId: specialist.id,
    status: RequestStatus.AwaitingConfirmation,
  });
});

describe("admin dispute triage queries", () => {
  it("moves a resolved dispute into history", async () => {
    await raiseDispute(client, requestId, "Течът остава");

    expect(await findResolvedDisputesForAdmin()).toEqual([]);

    await resolveDispute(admin, requestId, "Поправено");

    const history = await findResolvedDisputesForAdmin();
    expect(history).toHaveLength(1);
    expect(history?.[0]).toMatchObject({
      requestId,
      note: "Течът остава",
      resolutionNote: "Поправено",
    });
    expect(history?.[0].resolvedByName).toContain("ADMIN");
  });
});
