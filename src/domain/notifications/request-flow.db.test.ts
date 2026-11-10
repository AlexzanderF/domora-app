import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { outboxEvents, requireDb, users } from "@/db";
import type { Actor } from "@/domain/authorization";
import {
  assignSpecialist,
  claimRequest,
  recommendRequest,
} from "@/domain/dispatch";
import type { CreateRequestInput } from "@/domain/requests";
import {
  confirmCompletion,
  createRequest,
  rateRequest,
  startWork,
  submitReport,
} from "@/domain/requests";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { RequestPriority } from "@/domain/requests/types";
import { createActor, insertProfile } from "../../../tests/db/factories";
import { processOutbox } from "./index";
import type { Notifier, NotificationMessage } from "./notifier";
import { requestFlowHandlers } from "./request-flow";
import { renderTemplate } from "./templates";

let client: Actor;
let plumber: Actor;
let otherPlumber: Actor;
let electrician: Actor;
let farAwayPlumber: Actor;
let pending: Actor;
let admin: Actor;
let otherAdmin: Actor;

beforeEach(async () => {
  client = await createActor(UserRole.Client);
  plumber = await createActor(UserRole.Specialist);
  otherPlumber = await createActor(UserRole.Specialist);
  electrician = await createActor(UserRole.Specialist);
  farAwayPlumber = await createActor(UserRole.Specialist);
  pending = await createActor(UserRole.Specialist, UserStatus.Pending);
  admin = await createActor(UserRole.Admin);
  otherAdmin = await createActor(UserRole.Admin);
  await insertProfile(plumber.id, { category: "ВиК", area: "София" });
  await insertProfile(otherPlumber.id, { category: "ВиК", area: "София" });
  await insertProfile(electrician.id, { category: "Електро", area: "София" });
  await insertProfile(farAwayPlumber.id, { category: "ВиК", area: "Пловдив" });
  await insertProfile(pending.id, { category: "ВиК", area: "София" });
});

const booking = (priority?: RequestPriority): CreateRequestInput => ({
  category: 0,
  service: "Смяна на кран",
  description: "Тече кранът в кухнята",
  address: "София, ул. Тест 1",
  expectedPrice: 45,
  scheduledDate: "2026-12-01",
  scheduledTime: "10:00 - 12:00",
  priority,
});

async function emailOf(actor: Actor): Promise<string> {
  const [row] = await requireDb()
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, actor.id));
  return row.email;
}

async function emails(...actors: Actor[]): Promise<string[]> {
  return (await Promise.all(actors.map(emailOf))).sort();
}

async function outboxTypes(): Promise<string[]> {
  const rows = await requireDb().select().from(outboxEvents);
  return rows.map((row) => row.type);
}

// Runs the worker once and returns what the console notifier would send.
async function drain(): Promise<NotificationMessage[]> {
  const sent: NotificationMessage[] = [];
  const notifier: Notifier = {
    async send(message) {
      sent.push(message);
    },
  };
  await processOutbox({ notifier, handlers: requestFlowHandlers });
  return sent;
}

const recipients = (sent: NotificationMessage[], template: string) =>
  sent
    .filter((m) => m.template === template)
    .map((m) => m.to)
    .sort();

describe("new request", () => {
  it("tells only matching active specialists about the opportunity", async () => {
    await createRequest(client, booking());
    expect(await outboxTypes()).toEqual(["request.created"]);
    const sent = await drain();
    expect(recipients(sent, "new-opportunity")).toEqual(
      await emails(plumber, otherPlumber),
    );
  });

  it("does not email admins for a STANDARD request", async () => {
    await createRequest(client, booking(RequestPriority.Standard));
    const sent = await drain();
    expect(recipients(sent, "urgent-unassigned")).toEqual([]);
  });

  it.each([
    RequestPriority.Urgent,
    RequestPriority.Emergency,
    RequestPriority.Holiday,
  ])("emails every admin about an unassigned %s request", async (priority) => {
    await createRequest(client, booking(priority));
    const sent = await drain();
    expect(recipients(sent, "urgent-unassigned")).toEqual(
      await emails(admin, otherAdmin),
    );
  });

  it("skips the opportunity if the request was taken before fan-out", async () => {
    const request = await createRequest(client, booking());
    await claimRequest(plumber, request.id);
    const sent = await drain();
    expect(recipients(sent, "new-opportunity")).toEqual([]);
  });
});

describe("accepted", () => {
  it("notifies the client when a specialist claims the request", async () => {
    const request = await createRequest(client, booking());
    await drain();
    await claimRequest(plumber, request.id);
    expect(await outboxTypes()).toContain("request.accepted");
    const sent = await drain();
    expect(recipients(sent, "request-accepted")).toEqual(await emails(client));
  });

  it("notifies the client when an admin assigns a specialist", async () => {
    const request = await createRequest(client, booking());
    await drain();
    await assignSpecialist(admin, request.id, plumber.id);
    const sent = await drain();
    expect(recipients(sent, "request-accepted")).toEqual(await emails(client));
  });
});

describe("recommendation", () => {
  it("notifies only the recommended specialist", async () => {
    const request = await createRequest(client, booking());
    await drain();
    await recommendRequest(admin, request.id, plumber.id);
    expect(await outboxTypes()).toContain("request.recommended");
    const sent = await drain();
    expect(recipients(sent, "request-recommended")).toEqual(
      await emails(plumber),
    );
  });
});

describe("completion report", () => {
  it("notifies the client, and rating sends nothing", async () => {
    const request = await createRequest(client, booking());
    await claimRequest(plumber, request.id);
    await startWork(plumber, request.id);
    await drain();

    await submitReport(plumber, request.id, "Сменен кран, всичко работи.");
    expect(await outboxTypes()).toContain("request.report_submitted");
    const sent = await drain();
    expect(recipients(sent, "report-submitted")).toEqual(await emails(client));

    await confirmCompletion(client, request.id);
    await rateRequest(client, request.id, 5);
    expect(await drain()).toEqual([]);
  });
});

describe("rendered messages", () => {
  it("renders exact Bulgarian subjects", () => {
    const data = { title: "Кран", address: "София", priority: "EMERGENCY" };
    expect(renderTemplate("request-accepted", data).subject).toBe(
      "Заявката ви е приета",
    );
    expect(renderTemplate("urgent-unassigned", data).subject).toBe(
      "Неразпределена заявка: Аварийна",
    );
    expect(renderTemplate("urgent-unassigned", data).text).toContain("София");
  });

  it("renders Bulgarian subject and text for every template", async () => {
    const data = {
      title: "Смяна на кран",
      address: "София, ул. Тест 1",
      priority: "URGENT",
    };
    for (const name of [
      "request-accepted",
      "report-submitted",
      "new-opportunity",
      "request-recommended",
      "urgent-unassigned",
    ]) {
      const { subject, text, html } = renderTemplate(name, data);
      expect(subject).toMatch(/[А-Яа-я]/);
      expect(text).toContain("Смяна на кран");
      expect(html).toContain("Смяна на кран");
    }
  });
});
