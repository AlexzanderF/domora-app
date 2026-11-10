import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findViolations, isGuardedFile } from "./mobile-guard";

describe("findViolations", () => {
  const rules = (line: string) => findViolations(line).map((v) => v.rule);

  it("flags arbitrary max-width breakpoints, including stacked variants", () => {
    expect(rules('<div className="max-[700px]:hidden" />')).toEqual([
      "arbitrary-max",
    ]);
    expect(rules('"flex max-[560px]:w-full max-[900px]:grid"')).toEqual([
      "arbitrary-max",
      "arbitrary-max",
    ]);
    expect(rules('"max-w-[1320px] md:flex"')).toEqual([]);
  });

  it("flags the custom shell variants", () => {
    expect(rules('"shell-phone:hidden shell-tablet:px-7"')).toEqual([
      "shell-variant",
      "shell-variant",
    ]);
    expect(
      rules("@custom-variant shell-phone (@media (max-width: 700px));"),
    ).toEqual(["shell-variant"]);
  });

  it("flags vh units but not dvh, svh or lvh", () => {
    expect(rules('"min-h-[calc(100vh-130px)]"')).toEqual(["vh-unit"]);
    expect(rules("height: 65vh;")).toEqual(["vh-unit"]);
    expect(rules('"min-h-dvh h-[100svh] h-[50lvh]"')).toEqual([]);
  });

  it("flags text under 12px and allows 12px and up", () => {
    expect(rules('"text-[0.68rem]"')).toEqual(["small-text"]);
    expect(rules('"text-[11px]"')).toEqual(["small-text"]);
    expect(rules("font-size: 10px;")).toEqual(["small-text"]);
    expect(rules('"text-[12px] text-[0.75rem] text-[14px] text-xs"')).toEqual(
      [],
    );
  });

  it("flags form controls set below 16px", () => {
    expect(rules('<input className="px-3 text-sm" />')).toEqual([
      "small-input",
    ]);
    expect(rules('const authInputClass = "w-full text-[0.95rem]"')).toEqual([
      "small-input",
    ]);
    expect(rules('<select className="text-base" />')).toEqual([]);
    expect(rules('<p className="text-sm">not a field</p>')).toEqual([]);
  });

  it("does not mistake select-none or aria-selected for a form control", () => {
    expect(rules('"block text-sm select-none"')).toEqual([]);
    expect(rules('"text-[0.88rem] aria-selected:text-white"')).toEqual([]);
    expect(rules('<select className="text-sm" />')).toEqual(["small-input"]);
  });
});

describe("isGuardedFile", () => {
  it("covers non-admin source and skips admin, tests and non-source files", () => {
    expect(isGuardedFile("src/app/page.tsx")).toBe(true);
    expect(isGuardedFile("src/app/globals.css")).toBe(true);
    expect(isGuardedFile("src/app/(workspace)/admin/page.tsx")).toBe(false);
    expect(isGuardedFile("src/features/admin/admin-ui.tsx")).toBe(false);
    expect(isGuardedFile("src/conventions/mobile-guard.ts")).toBe(false);
    expect(isGuardedFile("src/components/ui/toast-provider.test.ts")).toBe(
      false,
    );
    expect(isGuardedFile("src/app/icon.svg")).toBe(false);
  });
});

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

describe("mobile convention guard (strict)", () => {
  it("finds no violations in non-admin source", () => {
    const counts = new Map<string, number>();
    for (const file of listFiles("src")) {
      const rel = file.split(path.sep).join("/");
      if (!isGuardedFile(rel)) continue;
      for (const { rule } of findViolations(readFileSync(file, "utf8"))) {
        const key = `${rel}::${rule}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    const offenders = [...counts].map(
      ([key, count]) => `${key}: found ${count}`,
    );

    expect(
      offenders,
      "New mobile-convention violations. Use Tailwind's standard mobile-first scale (see docs/specs/mobile-responsive.md); there is no allowlist.",
    ).toEqual([]);
  });
});
