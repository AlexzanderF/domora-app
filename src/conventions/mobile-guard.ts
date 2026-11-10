/**
 * Mobile-first convention guard (docs/specs/mobile-responsive.md, ADR 0008).
 * Pure scanning logic; the strict test lives in mobile-conventions.test.ts.
 */

export type GuardRule =
  "arbitrary-max" | "shell-variant" | "vh-unit" | "small-text" | "small-input";

export type Violation = { rule: GuardRule; line: number; text: string };

const ARBITRARY_MAX = /max-\[[^\]]*px\]/g;
const SHELL_VARIANT = /\bshell-(?:phone|tablet)\b/g;
// `\b` before the digits keeps dvh/svh/lvh (letter before "vh") from matching.
const VH_UNIT = /\d(?:\.\d+)?vh\b/g;
const TAILWIND_TEXT = /\btext-\[(\d*\.?\d+)(px|rem)\]/g;
const CSS_FONT_SIZE = /font-size:\s*(\d*\.?\d+)(px|rem)/g;
// "select" only counts as a standalone word, so select-none and aria-selected
// do not look like form controls.
const FIELD_HINT =
  /<(?:input|select|textarea)\b|input|textarea|(?<![\w-])select(?![\w-])|fieldControl/i;

const MIN_TEXT_PX = 12;
const MIN_INPUT_PX = 16;

function toPx(value: string, unit: string) {
  return unit === "rem" ? parseFloat(value) * 16 : parseFloat(value);
}

function sizesBelow(line: string, patterns: RegExp[], limitPx: number) {
  let found = 0;
  for (const pattern of patterns) {
    for (const match of line.matchAll(pattern)) {
      if (toPx(match[1], match[2]) < limitPx) found += 1;
    }
  }
  return found;
}

export function findViolations(source: string): Violation[] {
  const violations: Violation[] = [];
  source.split("\n").forEach((text, index) => {
    const line = index + 1;
    const push = (rule: GuardRule, count: number) => {
      for (let i = 0; i < count; i += 1) violations.push({ rule, line, text });
    };
    push("arbitrary-max", [...text.matchAll(ARBITRARY_MAX)].length);
    push("shell-variant", [...text.matchAll(SHELL_VARIANT)].length);
    push("vh-unit", [...text.matchAll(VH_UNIT)].length);
    push(
      "small-text",
      sizesBelow(text, [TAILWIND_TEXT, CSS_FONT_SIZE], MIN_TEXT_PX),
    );
    if (FIELD_HINT.test(text)) {
      // Heuristic: a line that mentions a form control and sets its text size
      // under 16px (text-xs, text-sm or an arbitrary size).
      const named = [...text.matchAll(/\btext-(?:xs|sm)\b/g)].length;
      push(
        "small-input",
        named + sizesBelow(text, [TAILWIND_TEXT], MIN_INPUT_PX),
      );
    }
  });
  return violations;
}

/** Non-admin source and styles; tests and the guard itself are exempt. */
export function isGuardedFile(file: string): boolean {
  if (!/\.(tsx?|css)$/.test(file)) return false;
  if (/\.test\.tsx?$/.test(file)) return false;
  if (file.startsWith("src/conventions/")) return false;
  if (/(^|\/)admin(\/|$)/.test(file)) return false;
  return true;
}
