import { describe, expect, it } from "vitest";
import { MAX_ATTEMPTS, backoffMs } from "./index";
import { renderTemplate } from "./templates";

describe("backoffMs", () => {
  it("doubles the wait after each failed attempt", () => {
    expect(backoffMs(2)).toBe(backoffMs(1) * 2);
    expect(backoffMs(3)).toBe(backoffMs(1) * 4);
  });

  it("allows five attempts", () => {
    expect(MAX_ATTEMPTS).toBe(5);
  });
});

describe("renderTemplate", () => {
  it("returns a Bulgarian subject, text and HTML", () => {
    const mail = renderTemplate("request-completed", {
      title: "Смяна на кран",
    });
    expect(mail.subject).toBe("Заявката ви е изпълнена");
    expect(mail.text).toContain("Смяна на кран");
    expect(mail.html).toContain("Смяна на кран");
  });

  it("escapes user text in the HTML body", () => {
    const mail = renderTemplate("request-completed", { title: "<b>&</b>" });
    expect(mail.html).toContain("&lt;b&gt;&amp;&lt;/b&gt;");
    expect(mail.html).not.toContain("<b>");
  });

  it("rejects an unknown template", () => {
    expect(() => renderTemplate("nope", {})).toThrow(/nope/);
  });
});
