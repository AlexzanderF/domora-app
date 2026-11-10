import { describe, expect, it } from "vitest";
import { UserRole } from "@/domain/identity/types";
import { Role } from "@/domain/requests/types";
import { getDrawerModel } from "./drawer-nav";

describe("getDrawerModel", () => {
  it("lists the role's items and marks only the current section active", () => {
    const { items } = getDrawerModel(Role.Client, "/client/requests/42", null);

    expect(items.map((item) => [item.label, item.active])).toEqual([
      ["Табло", false],
      ["Моите заявки", true],
      ["Абонамент", false],
      ["Профил", false],
    ]);
  });

  it("describes the account block with a role label and initial", () => {
    const { account } = getDrawerModel(Role.Specialist, "/specialist", {
      name: "  мария Иванова",
      role: UserRole.Specialist,
    });

    expect(account).toEqual({
      name: "  мария Иванова",
      roleLabel: "Специалист",
      initial: "М",
    });
  });

  it("labels admins and clients and has no account when signed out", () => {
    expect(
      getDrawerModel(Role.Admin, "/admin", {
        name: "Ани",
        role: UserRole.Admin,
      }).account?.roleLabel,
    ).toBe("Администратор");
    expect(
      getDrawerModel(Role.Client, "/client", {
        name: "Ив",
        role: UserRole.Client,
      }).account?.roleLabel,
    ).toBe("Клиент");
    expect(getDrawerModel(Role.Client, "/client", null).account).toBeNull();
  });
});
