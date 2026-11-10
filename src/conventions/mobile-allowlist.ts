/**
 * Ratchet allowlist for the mobile convention guard (mobile-guard.ts).
 *
 * Key: "<file>::<rule>"; value: how many violations that file may still have.
 * Never raise a number or add an entry. When a ticket migrates a file, lower
 * its count (or delete the entry once it reaches 0). The goal is an empty
 * object. Run `npx vitest run src/conventions` to see what is still found.
 */
export const MOBILE_ALLOWLIST: Record<string, number> = {
  "src/app/globals.css::shell-variant": 2,
  "src/components/ui/label.tsx::small-input": 1,
  "src/features/plans/date-picker.tsx::small-text": 1,
  "src/features/plans/time-picker.tsx::small-input": 1,
  "src/features/services/service-grid.tsx::arbitrary-max": 4,
};
