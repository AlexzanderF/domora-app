import { describe, expect, it } from "vitest";
import { getSiteNav } from "./site-nav";

describe("getSiteNav", () => {
  it("public: anchors, Вход in the drawer and Регистрация as the CTA", () => {
    const nav = getSiteNav("public");
    expect(nav.links.map((l) => l.label)).toEqual([
      "Как работи",
      "Услуги",
      "ЧЗВ",
      "Контакти",
    ]);
    expect(nav.secondary).toEqual({ label: "Вход", href: "/login" });
    expect(nav.primary).toEqual({ label: "Регистрация", href: "/signup" });
  });

  it("plans: logged-in links and the dashboard CTA", () => {
    const nav = getSiteNav("plans");
    expect(nav.links.map((l) => l.href)).toEqual(["/", "/client/requests"]);
    expect(nav.secondary).toBeNull();
    expect(nav.primary).toEqual({ label: "Към таблото", href: "/client" });
  });

  it("auth: minimal back link only", () => {
    const nav = getSiteNav("auth");
    expect(nav.links).toEqual([]);
    expect(nav.primary).toEqual({ label: "← Към началото", href: "/" });
  });
});
