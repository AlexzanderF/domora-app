import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { requestEvents, requireDb, requests } from "@/db";
import type { Actor } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { RequestStatus } from "@/domain/requests/types";
import { createActor, insertRequest } from "../../../tests/db/factories";
import {
  cancelRequest,
  releaseRequest,
  confirmCompletion,
  createRequest,
  getRequest,
  listAgenda,
  listAll,
  listClientRequests,
  rateRequest,
  startWork,
  submitReport,
  type CreateRequestInput,
} from "./index";

const booking: CreateRequestInput = {
  category: 0,
  service: "Смяна на кран",
  description: "Тече кранът в кухнята",
  address: "София, ул. Тест 1",
  expectedPrice: 45,
  scheduledDate: "2030-05-17",
  scheduledTime: "09:00 - 12:00",
};

let client: Actor;
let otherClient: Actor;
let specialist: Actor;
let otherSpecialist: Actor;
let pendingSpecialist: Actor;
let admin: Actor;

beforeEach(async () => {
  client = await createActor(UserRole.Client);
  otherClient = await createActor(UserRole.Client);
  specialist = await createActor(UserRole.Specialist);
  otherSpecialist = await createActor(UserRole.Specialist);
  pendingSpecialist = await createActor(
    UserRole.Specialist,
    UserStatus.Pending,
  );
  admin = await createActor(UserRole.Admin);
});

async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (error: { code?: string }) => error.code ?? "UNKNOWN",
  );
}

async function statusOf(id: number) {
  const [row] = await requireDb()
    .select()
    .from(requests)
    .where(eq(requests.id, id));
  return row;
}

async function eventsOf(id: number) {
  const rows = await requireDb()
    .select()
    .from(requestEvents)
    .where(eq(requestEvents.requestId, id))
    .orderBy(requestEvents.id);
  return rows.map((r) => [r.type, r.fromStatus, r.toStatus, r.actorId]);
}

describe("createRequest", () => {
  it("persists the booking with its date and time and returns a DTO", async () => {
    const created = await createRequest(client, booking);

    expect(created).toMatchObject({
      clientId: client.id,
      specialistId: null,
      title: "Смяна на кран",
      status: RequestStatus.Created,
      price: 45,
      scheduledDate: "2030-05-17",
      scheduledTime: "09:00 - 12:00",
      clientPhone: "0888000000",
    });
    expect(await getRequest(client, created.id)).toEqual(created);
  });

  it("records a created event", async () => {
    const created = await createRequest(client, booking);
    expect(await eventsOf(created.id)).toEqual([
      ["request.created", null, RequestStatus.Created, client.id],
    ]);
  });

  it("rejects specialists and unauthenticated callers", async () => {
    expect(await rejection(createRequest(specialist, booking))).toBe(
      "FORBIDDEN",
    );
    expect(await rejection(createRequest(null, booking))).toBe(
      "UNAUTHENTICATED",
    );
    expect(await listAll(admin)).toEqual([]);
  });

  it.each([
    ["a blank address", { address: "  " }],
    ["a too-short description", { description: "abc" }],
    ["an invalid date", { scheduledDate: "2030-02-31" }],
    ["a malformed date", { scheduledDate: "17.05.2030" }],
    ["a blank time window", { scheduledTime: " " }],
    ["an unknown category", { category: 9 as never }],
  ])("rejects %s", async (_label, override) => {
    expect(
      await rejection(createRequest(client, { ...booking, ...override })),
    ).toBe("INVALID_INPUT");
    expect(await listAll(admin)).toEqual([]);
  });
});

describe("createRequest pricing", () => {
  it("stores the price computed from the Tariffs, not a client price", async () => {
    const created = await createRequest(client, {
      ...booking,
      category: 1,
      expectedPrice: 35,
    });
    expect(created.price).toBe(35);
  });

  it("rejects a tampered or stale price and creates nothing", async () => {
    for (const expectedPrice of [1, 0, 3_000_000_000]) {
      expect(
        await rejection(createRequest(client, { ...booking, expectedPrice })),
      ).toBe("PRICE_CHANGED");
    }
    expect(await listAll(admin)).toEqual([]);
  });
});

describe("visibility", () => {
  it("shows a request to its client, its assigned specialist and admins only", async () => {
    const id = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
    });

    for (const allowed of [client, specialist, admin]) {
      expect((await getRequest(allowed, id)).id).toBe(id);
    }
    expect((await listClientRequests(client)).map((r) => r.id)).toEqual([id]);
    expect((await listAgenda(specialist)).map((r) => r.id)).toEqual([id]);
    expect((await listAll(admin)).map((r) => r.id)).toEqual([id]);
    for (const denied of [otherClient, otherSpecialist, pendingSpecialist]) {
      expect(await rejection(getRequest(denied, id))).toBe("FORBIDDEN");
    }
    expect(await listClientRequests(otherClient)).toEqual([]);
    expect(await listAgenda(otherSpecialist)).toEqual([]);
    expect(await listAgenda(pendingSpecialist)).toEqual([]);
    expect(await rejection(getRequest(null, id))).toBe("UNAUTHENTICATED");
  });

  it("reports a missing request as not found", async () => {
    expect(await rejection(getRequest(admin, 9999))).toBe("NOT_FOUND");
  });
});

describe("startWork", () => {
  async function accepted() {
    return insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
    });
  }

  it("moves an accepted request to in progress and records an event", async () => {
    const id = await accepted();
    const result = await startWork(specialist, id);

    expect(result.status).toBe(RequestStatus.InProgress);
    expect((await statusOf(id)).status).toBe(RequestStatus.InProgress);
    expect(await eventsOf(id)).toEqual([
      [
        "request.started",
        RequestStatus.Accepted,
        RequestStatus.InProgress,
        specialist.id,
      ],
    ]);
  });

  it("refuses an admin starting work", async () => {
    const id = await accepted();
    expect(await rejection(startWork(admin, id))).toBe("FORBIDDEN");
    expect((await statusOf(id)).status).toBe(RequestStatus.Accepted);
  });

  it("rejects the wrong or an unauthenticated actor without changing anything", async () => {
    const id = await accepted();
    for (const wrong of [
      client,
      otherClient,
      otherSpecialist,
      pendingSpecialist,
    ]) {
      expect(await rejection(startWork(wrong, id))).toBe("FORBIDDEN");
    }
    expect(await rejection(startWork(null, id))).toBe("UNAUTHENTICATED");
    expect((await statusOf(id)).status).toBe(RequestStatus.Accepted);
    expect(await eventsOf(id)).toEqual([]);
  });

  it("rejects starting a request that is not accepted or is cancelled", async () => {
    const unassigned = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
    });
    expect(await rejection(startWork(specialist, unassigned))).toBe(
      "INVALID_STATE",
    );

    const cancelled = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
      cancelled: true,
    });
    expect(await rejection(startWork(specialist, cancelled))).toBe(
      "INVALID_STATE",
    );
  });
});

describe("submitReport", () => {
  async function inProgress() {
    return insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.InProgress,
    });
  }

  it("stores the trimmed report, awaits confirmation and stamps the time", async () => {
    const id = await inProgress();
    const result = await submitReport(specialist, id, "  Сменен кран  ");

    expect(result).toMatchObject({
      status: RequestStatus.AwaitingConfirmation,
      report: "Сменен кран",
    });
    expect(result.reportSubmittedAt).not.toBeNull();
    expect(await eventsOf(id)).toEqual([
      [
        "request.report_submitted",
        RequestStatus.InProgress,
        RequestStatus.AwaitingConfirmation,
        specialist.id,
      ],
    ]);
  });

  it("requires a non-blank report", async () => {
    const id = await inProgress();
    expect(await rejection(submitReport(specialist, id, "   "))).toBe(
      "INVALID_INPUT",
    );
    expect((await statusOf(id)).status).toBe(RequestStatus.InProgress);
  });

  it("rejects the wrong or an unauthenticated actor", async () => {
    const id = await inProgress();
    for (const wrong of [client, admin, otherSpecialist, pendingSpecialist]) {
      expect(await rejection(submitReport(wrong, id, "Готово"))).toBe(
        "FORBIDDEN",
      );
    }
    expect(await rejection(submitReport(null, id, "Готово"))).toBe(
      "UNAUTHENTICATED",
    );
    expect((await statusOf(id)).report).toBeNull();
  });

  it("rejects a request that is not in progress", async () => {
    const id = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
    });
    expect(await rejection(submitReport(specialist, id, "Готово"))).toBe(
      "INVALID_STATE",
    );
  });
});

describe("confirmCompletion", () => {
  async function awaiting() {
    return insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.AwaitingConfirmation,
      report: "Готово",
    });
  }

  it("lets the owner complete the request and stamps the time", async () => {
    const id = await awaiting();
    const result = await confirmCompletion(client, id);

    expect(result.status).toBe(RequestStatus.Completed);
    expect(result.completedAt).not.toBeNull();
    expect(await eventsOf(id)).toEqual([
      [
        "request.completed",
        RequestStatus.AwaitingConfirmation,
        RequestStatus.Completed,
        client.id,
      ],
    ]);
  });

  it("rejects everyone but the owner and admins", async () => {
    const id = await awaiting();
    for (const wrong of [otherClient, specialist, pendingSpecialist]) {
      expect(await rejection(confirmCompletion(wrong, id))).toBe("FORBIDDEN");
    }
    expect(await rejection(confirmCompletion(null, id))).toBe(
      "UNAUTHENTICATED",
    );
    expect((await statusOf(id)).status).toBe(
      RequestStatus.AwaitingConfirmation,
    );
  });

  it("rejects a request that has no report awaiting confirmation", async () => {
    const id = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.InProgress,
    });
    expect(await rejection(confirmCompletion(client, id))).toBe(
      "INVALID_STATE",
    );
  });
});

describe("rateRequest", () => {
  async function completed() {
    return insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Completed,
    });
  }

  it("lets the owner rate once and stamps the time", async () => {
    const id = await completed();
    const result = await rateRequest(client, id, 5);

    expect(result.rating).toBe(5);
    expect(result.ratedAt).not.toBeNull();
    expect(await eventsOf(id)).toEqual([
      [
        "request.rated",
        RequestStatus.Completed,
        RequestStatus.Completed,
        client.id,
      ],
    ]);
    expect(await rejection(rateRequest(client, id, 4))).toBe("INVALID_STATE");
    expect((await statusOf(id)).rating).toBe(5);
  });

  it("works only for the request's owner", async () => {
    const id = await completed();
    for (const wrong of [otherClient, specialist, pendingSpecialist]) {
      expect(await rejection(rateRequest(wrong, id, 5))).toBe("FORBIDDEN");
    }
    expect(await rejection(rateRequest(null, id, 5))).toBe("UNAUTHENTICATED");
    expect((await statusOf(id)).rating).toBeNull();
  });

  it.each([0, 6, 3.5])("rejects the rating %s", async (rating) => {
    const id = await completed();
    expect(await rejection(rateRequest(client, id, rating))).toBe(
      "INVALID_INPUT",
    );
  });

  it("rejects rating a request that is not completed", async () => {
    const id = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.AwaitingConfirmation,
    });
    expect(await rejection(rateRequest(client, id, 5))).toBe("INVALID_STATE");
  });
});

describe("cancelRequest", () => {
  it("lets the owner cancel an open request and records an event", async () => {
    const id = await insertRequest({ clientId: client.id });
    const result = await cancelRequest(client, id);

    expect(result.cancelled).toBe(true);
    expect(await eventsOf(id)).toEqual([
      [
        "request.cancelled",
        RequestStatus.Created,
        RequestStatus.Created,
        client.id,
      ],
    ]);
  });

  it("rejects other clients, unassigned specialists and unauthenticated callers", async () => {
    const id = await insertRequest({ clientId: client.id });
    for (const wrong of [otherClient, specialist, pendingSpecialist]) {
      expect(await rejection(cancelRequest(wrong, id))).toBe("FORBIDDEN");
    }
    expect(await rejection(cancelRequest(null, id))).toBe("UNAUTHENTICATED");
    expect((await statusOf(id)).cancelled).toBe(false);
  });

  it("rejects cancelling work that is already awaiting confirmation", async () => {
    const id = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.AwaitingConfirmation,
    });
    expect(await rejection(cancelRequest(client, id))).toBe("INVALID_STATE");
  });

  it("no longer accepts a specialist, even the assigned one", async () => {
    const id = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
    });
    expect(await rejection(cancelRequest(specialist, id))).toBe("FORBIDDEN");
    expect((await statusOf(id)).status).toBe(RequestStatus.Accepted);
  });
});

describe("releaseRequest", () => {
  it("returns an accepted request to the open pool and records an event", async () => {
    const id = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
    });
    const result = await releaseRequest(specialist, id);

    expect(result).toMatchObject({
      status: RequestStatus.Created,
      specialistId: null,
      cancelled: false,
    });
    expect(await eventsOf(id)).toEqual([
      [
        "request.released",
        RequestStatus.Accepted,
        RequestStatus.Created,
        specialist.id,
      ],
    ]);
  });

  it("rejects everyone but the assigned Active specialist", async () => {
    const id = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
    });
    for (const wrong of [client, admin, otherSpecialist, pendingSpecialist]) {
      expect(await rejection(releaseRequest(wrong, id))).toBe("FORBIDDEN");
    }
    expect(await rejection(releaseRequest(null, id))).toBe("UNAUTHENTICATED");
  });

  it("rejects work that is in progress or cancelled", async () => {
    const started = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.InProgress,
    });
    expect(await rejection(releaseRequest(specialist, started))).toBe(
      "INVALID_STATE",
    );
    const cancelled = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Accepted,
      cancelled: true,
    });
    expect(await rejection(releaseRequest(specialist, cancelled))).toBe(
      "INVALID_STATE",
    );
  });
});
