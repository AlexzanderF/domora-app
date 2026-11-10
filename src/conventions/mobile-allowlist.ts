/**
 * Ratchet allowlist for the mobile convention guard (mobile-guard.ts).
 *
 * Key: "<file>::<rule>"; value: how many violations that file may still have.
 * Never raise a number or add an entry. When a ticket migrates a file, lower
 * its count (or delete the entry once it reaches 0). The goal is an empty
 * object. Run `npx vitest run src/conventions` to see what is still found.
 */
export const MOBILE_ALLOWLIST: Record<string, number> = {
  "src/app/(marketing)/plans/page.tsx::arbitrary-max": 3,
  "src/app/(marketing)/plans/page.tsx::small-text": 1,
  "src/app/(marketing)/plans/page.tsx::vh-unit": 1,
  "src/app/(workspace)/client/profile/page.tsx::arbitrary-max": 5,
  "src/app/contact/page.tsx::arbitrary-max": 10,
  "src/app/contact/page.tsx::vh-unit": 3,
  "src/app/globals.css::shell-variant": 2,
  "src/app/page.tsx::arbitrary-max": 2,
  "src/components/ui/label.tsx::small-input": 1,
  "src/features/bookings/booking-button.tsx::arbitrary-max": 1,
  "src/features/bookings/booking-dialog.tsx::arbitrary-max": 7,
  "src/features/bookings/booking-dialog.tsx::small-text": 2,
  "src/features/bookings/booking-dialog.tsx::vh-unit": 1,
  "src/features/bookings/field-styles.ts::small-input": 3,
  "src/features/bookings/field-styles.ts::small-text": 1,
  "src/features/client-dashboard/client-dashboard.tsx::arbitrary-max": 24,
  "src/features/client-dashboard/client-dashboard.tsx::small-text": 6,
  "src/features/client-profile/client-profile-form.tsx::arbitrary-max": 9,
  "src/features/landing/final-cta.tsx::arbitrary-max": 5,
  "src/features/landing/final-cta.tsx::small-text": 1,
  "src/features/landing/hero.tsx::arbitrary-max": 9,
  "src/features/landing/hero.tsx::small-text": 1,
  "src/features/landing/how-it-works.tsx::arbitrary-max": 3,
  "src/features/landing/landing-footer.tsx::arbitrary-max": 5,
  "src/features/landing/landing-header.tsx::arbitrary-max": 35,
  "src/features/landing/service-showcase.tsx::arbitrary-max": 7,
  "src/features/landing/service-showcase.tsx::small-text": 6,
  "src/features/landing/trust-sections.tsx::arbitrary-max": 7,
  "src/features/plans/date-picker.tsx::small-text": 1,
  "src/features/plans/home-plan-preview.tsx::arbitrary-max": 3,
  "src/features/plans/home-plan-preview.tsx::small-text": 2,
  "src/features/plans/plans-configurator.tsx::arbitrary-max": 7,
  "src/features/plans/plans-configurator.tsx::small-text": 4,
  "src/features/plans/plans-footer.tsx::arbitrary-max": 5,
  "src/features/plans/plans-header.tsx::arbitrary-max": 26,
  "src/features/plans/time-picker.tsx::small-input": 1,
  "src/features/requests/request-list.tsx::arbitrary-max": 2,
  "src/features/services/service-grid.tsx::arbitrary-max": 4,
  "src/features/subscriptions/client-plan-view.tsx::arbitrary-max": 5,
  "src/features/subscriptions/client-plan-view.tsx::small-text": 1,
};
