import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageContainer } from "./page-container";

function classesOf(html: string) {
  return html.split(/["\s]/);
}

describe("PageContainer", () => {
  it("renders children with the shared gutters in a centred full-width box", () => {
    const html = renderToStaticMarkup(
      createElement(PageContainer, null, "hello"),
    );
    expect(html).toContain("hello");
    for (const cls of ["mx-auto", "w-full", "px-4", "sm:px-6", "lg:px-11"]) {
      expect(classesOf(html)).toContain(cls);
    }
  });

  it("applies the max width of the requested surface", () => {
    const html = renderToStaticMarkup(
      createElement(PageContainer, { size: "plans" }, "x"),
    );
    expect(classesOf(html)).toContain("max-w-295");
  });

  it("lets callers add classes, render another element and forward props", () => {
    const html = renderToStaticMarkup(
      createElement(
        PageContainer,
        { as: "main", className: "py-8", id: "content" },
        "x",
      ),
    );
    expect(html.startsWith("<main")).toBe(true);
    expect(html).toContain("py-8");
    expect(html).toContain('id="content"');
  });
});
