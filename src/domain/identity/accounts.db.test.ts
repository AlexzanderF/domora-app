import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { outboxEvents, requireDb, users } from "@/db";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { createActor } from "../../../tests/db/factories";
import {
  authenticate,
  registerClient,
  registerSpecialist,
  setSpecialistStatus,
  updateClientProfile,
} from "./index";

async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (error: { code?: string }) => error.code ?? "UNKNOWN",
  );
}

async function eventsOf(type: string) {
  return requireDb()
    .select()
    .from(outboxEvents)
    .where(eq(outboxEvents.type, type));
}

const client = {
  name: " Мария Петрова ",
  email: " Maria@Example.com ",
  phone: "0888123456",
  password: "secret12",
};

describe("registerClient", () => {
  it("creates an Active client with a hashed password and normalized fields", async () => {
    const userId = await registerClient(client);

    const [row] = await requireDb()
      .select()
      .from(users)
      .where(eq(users.id, userId));
    expect(row).toMatchObject({
      name: "Мария Петрова",
      email: "maria@example.com",
      role: UserRole.Client,
      status: UserStatus.Active,
    });
    expect(row.passwordHash).not.toBe(client.password);
    expect(await bcrypt.compare(client.password, row.passwordHash)).toBe(true);
  });

  it("writes an account.client_registered event with the user", async () => {
    const userId = await registerClient(client);
    const events = await eventsOf("account.client_registered");
    expect(events.map((e) => e.payload)).toEqual([{ userId }]);
  });

  it("refuses a taken email or phone and stores nothing", async () => {
    await registerClient(client);
    expect(
      await rejection(registerClient({ ...client, phone: "0899000000" })),
    ).toBe("EMAIL_TAKEN");
    expect(
      await rejection(
        registerClient({ ...client, email: "other@example.com" }),
      ),
    ).toBe("PHONE_TAKEN");
    expect(await eventsOf("account.client_registered")).toHaveLength(1);
  });
});

describe("authenticate", () => {
  it("accepts email or phone with the right password", async () => {
    const userId = await registerClient(client);
    expect(await authenticate("MARIA@example.com", client.password)).toBe(
      userId,
    );
    expect(await authenticate("0888123456", client.password)).toBe(userId);
  });

  it("writes no event", async () => {
    await registerClient(client);
    const before = await requireDb().select().from(outboxEvents);
    await authenticate(client.email, client.password);
    expect(await requireDb().select().from(outboxEvents)).toHaveLength(
      before.length,
    );
  });

  it("gives the same refusal for a wrong password and an unknown account", async () => {
    await registerClient(client);
    expect(await rejection(authenticate(client.email, "wrong-pass"))).toBe(
      "INVALID_CREDENTIALS",
    );
    expect(await rejection(authenticate("nobody@example.com", "x"))).toBe(
      "INVALID_CREDENTIALS",
    );
  });

  it("refuses a rejected Specialist but lets a pending one in", async () => {
    const specialistId = await registerSpecialist({
      name: "Мартин Колев",
      email: "spec@example.com",
      phone: "0888111222",
      passwordHash: await bcrypt.hash("secret12", 4),
      profile: {
        category: "ВиК",
        area: "София",
        experienceYears: 5,
        bio: "Опитен майстор",
      },
    });
    expect(await authenticate("spec@example.com", "secret12")).toBe(
      specialistId,
    );

    const admin = await createActor(UserRole.Admin);
    await setSpecialistStatus(admin, specialistId, UserStatus.Rejected);
    expect(await rejection(authenticate("spec@example.com", "secret12"))).toBe(
      "REJECTED_SPECIALIST",
    );
  });
});

describe("updateClientProfile", () => {
  const input = {
    name: "Мария Иванова",
    email: "new@example.com",
    phone: "0877000111",
    propertyAddress: "София, ул. Нова 5",
  };

  async function signedUpClient() {
    const userId = await registerClient(client);
    return { id: userId, role: UserRole.Client, status: UserStatus.Active };
  }

  it("lets the owner update their profile and writes account.profile_updated", async () => {
    const actor = await signedUpClient();
    await updateClientProfile(actor, actor.id, input);

    const [row] = await requireDb()
      .select()
      .from(users)
      .where(eq(users.id, actor.id));
    expect(row).toMatchObject(input);
    const events = await eventsOf("account.profile_updated");
    expect(events.map((e) => e.payload)).toEqual([{ userId: actor.id }]);
  });

  it("refuses anyone but the owner, admins included", async () => {
    const owner = await signedUpClient();
    const otherClient = await createActor(UserRole.Client);
    const admin = await createActor(UserRole.Admin);
    for (const actor of [otherClient, admin]) {
      expect(await rejection(updateClientProfile(actor, owner.id, input))).toBe(
        "FORBIDDEN",
      );
    }
    expect(await rejection(updateClientProfile(null, owner.id, input))).toBe(
      "UNAUTHENTICATED",
    );
    expect(await eventsOf("account.profile_updated")).toHaveLength(0);
  });

  it("refuses an email or phone another account uses", async () => {
    const owner = await signedUpClient();
    await registerClient({
      name: "Друг",
      email: "taken@example.com",
      phone: "0877999999",
      password: "secret12",
    });
    expect(
      await rejection(
        updateClientProfile(owner, owner.id, {
          ...input,
          email: "taken@example.com",
        }),
      ),
    ).toBe("EMAIL_TAKEN");
    expect(
      await rejection(
        updateClientProfile(owner, owner.id, {
          ...input,
          phone: "0877999999",
        }),
      ),
    ).toBe("PHONE_TAKEN");
  });

  it("keeps the owner's own email and phone without a conflict", async () => {
    const owner = await signedUpClient();
    await updateClientProfile(owner, owner.id, {
      ...input,
      email: "maria@example.com",
      phone: client.phone,
    });
  });
});
