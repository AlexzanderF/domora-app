import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { outboxEvents, requireDb, users } from "@/db";
import type { Actor } from "@/domain/authorization";
import { raiseDispute, resolveDispute } from "@/domain/disputes";
import { registerSpecialist, setSpecialistStatus } from "@/domain/identity";
import { UserRole, UserStatus } from "@/features/auth/types";
import { RequestStatus } from "@/features/requests/types";
import {
  createActor,
  insertProfile,
  insertRequest,
} from "../../../tests/db/factories";
import { processOutbox } from "./index";
import type { Notifier, NotificationMessage } from "./notifier";
import { accountFlowHandlers } from "./account-flow";
import { renderTemplate } from "./templates";

let client: Actor;
let specialist: Actor;
let admin: Actor;
let otherAdmin: Actor;
let bystander: Actor;

beforeEach(async () => {
  client = await createActor(UserRole.Client);
  specialist = await createActor(UserRole.Specialist);
  bystander = await createActor(UserRole.Specialist);
  admin = await createActor(UserRole.Admin);
  otherAdmin = await createActor(UserRole.Admin);
  await insertProfile(specialist.id);
});

async function emails(...actors: Actor[]): Promise<string[]> {
  const rows = await Promise.all(
    actors.map(async (actor) => {
      const [row] = await requireDb()
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, actor.id));
      return row.email;
    }),
  );
  return rows.sort();
}

async function outboxTypes(): Promise<string[]> {
  const rows = await requireDb().select().from(outboxEvents);
  return rows.map((row) => row.type);
}

async function drain(): Promise<NotificationMessage[]> {
  const sent: NotificationMessage[] = [];
  const notifier: Notifier = {
    async send(message) {
      sent.push(message);
    },
  };
  await processOutbox({ notifier, handlers: accountFlowHandlers });
  return sent;
}

const to = (sent: NotificationMessage[], template: string) =>
  sent
    .filter((m) => m.template === template)
    .map((m) => m.to)
    .sort();

async function awaitingRequest(): Promise<number> {
  return insertRequest({
    clientId: client.id,
    specialistId: specialist.id,
    status: RequestStatus.AwaitingConfirmation,
  });
}

describe("specialist signup and decision", () => {
  it("tells every admin about a new signup", async () => {
    await registerSpecialist({
      name: "Иван Петров",
      email: "ivan@example.com",
      phone: "0888111222",
      passwordHash: "x",
      profile: {
        category: "ВиК",
        area: "София",
        experienceYears: 3,
        bio: "Майстор",
      },
    });
    expect(await outboxTypes()).toEqual(["specialist.registered"]);
    const sent = await drain();
    expect(to(sent, "specialist-registered")).toEqual(
      await emails(admin, otherAdmin),
    );
    expect(sent).toHaveLength(2);
  });

  it("tells the specialist when approved", async () => {
    await setSpecialistStatus(admin, bystander.id, UserStatus.Active);
    await setSpecialistStatus(admin, specialist.id, UserStatus.Rejected);
    await drain();
    await setSpecialistStatus(admin, specialist.id, UserStatus.Active);
    expect(await outboxTypes()).toContain("specialist.approved");
    expect(to(await drain(), "specialist-approved")).toEqual(
      await emails(specialist),
    );
  });

  it("tells the specialist when rejected", async () => {
    await setSpecialistStatus(admin, specialist.id, UserStatus.Rejected);
    expect(await outboxTypes()).toContain("specialist.rejected");
    const sent = await drain();
    expect(to(sent, "specialist-rejected")).toEqual(await emails(specialist));
    expect(sent).toHaveLength(1);
  });

  it("does not repeat the email when the status does not change", async () => {
    await setSpecialistStatus(admin, specialist.id, UserStatus.Rejected);
    await drain();
    await setSpecialistStatus(admin, specialist.id, UserStatus.Rejected);
    expect(await drain()).toEqual([]);
  });
});

describe("disputes", () => {
  it("tells the specialist and admins when an issue is raised", async () => {
    const id = await awaitingRequest();
    await raiseDispute(client, id, "Кранът пак тече");
    expect(await outboxTypes()).toEqual(["request.dispute_raised"]);
    const sent = await drain();
    expect(to(sent, "dispute-raised")).toEqual(
      await emails(specialist, admin, otherAdmin),
    );
    expect(sent).toHaveLength(3);
  });

  it("tells only the admins when no specialist is assigned", async () => {
    const id = await insertRequest({
      clientId: client.id,
      status: RequestStatus.AwaitingConfirmation,
    });
    await raiseDispute(client, id, "Кранът пак тече");
    expect(to(await drain(), "dispute-raised")).toEqual(
      await emails(admin, otherAdmin),
    );
  });

  it("tells the client and the specialist when resolved", async () => {
    const id = await awaitingRequest();
    await raiseDispute(client, id, "Кранът пак тече");
    await drain();
    await resolveDispute(admin, id, "Майсторът ще поправи");
    expect(await outboxTypes()).toContain("request.dispute_resolved");
    const sent = await drain();
    expect(to(sent, "dispute-resolved")).toEqual(
      await emails(client, specialist),
    );
    expect(sent).toHaveLength(2);
  });
});

describe("rendered messages", () => {
  it("renders exact Bulgarian subjects", () => {
    const data = { name: "Иван", title: "Кран", note: "Тече" };
    expect(renderTemplate("specialist-registered", data).subject).toBe(
      "Нов специалист чака одобрение",
    );
    expect(renderTemplate("specialist-approved", data).subject).toBe(
      "Профилът ви е одобрен",
    );
    expect(renderTemplate("specialist-rejected", data).subject).toBe(
      "Профилът ви не е одобрен",
    );
    expect(renderTemplate("dispute-raised", data).subject).toBe(
      "Подаден е проблем по заявка",
    );
    expect(renderTemplate("dispute-resolved", data).subject).toBe(
      "Проблемът по заявката е разрешен",
    );
    for (const name of ["dispute-raised", "dispute-resolved"]) {
      expect(renderTemplate(name, data).text).toContain("Кран");
    }
    expect(renderTemplate("specialist-registered", data).text).toContain(
      "Иван",
    );
  });
});
