# Mobile-first responsive design spec

Goal: every non-admin screen of DOMORA works well on phones (360px minimum), designed mobile-first. The hard-to-reverse choices are in [ADR 0008](../adr/0008-mobile-first-responsive-system.md). This spec says how each surface behaves, precisely enough to build without another design call.

Source: the decision tickets of map [#188](https://github.com/AlexzanderF/domora-app/issues/188) and the current-state audit (`docs/research/mobile-responsive-audit.md` on branch `research/mobile-audit`). The navigation prototype is on branch `prototype/phone-nav`.

Scope: landing, plans, contact, auth (login, signup, forgot/reset password, pending approval), client workspace, specialist workspace, booking flow. Out of scope: admin, offline/PWA.

## 1. Conventions

- **Breakpoints:** Tailwind's standard scale only. Unprefixed = phone. No `max-[Npx]` classes and no `shell-*` variants.
- **Migration:** one up-front, behaviour-preserving sweep of every non-admin surface, then a lint/grep guard against arbitrary `max-[…px]` and `shell-*`. Redesign work below lands on top.
- **Container:** `mx-auto w-full max-w-<per surface> px-4 sm:px-6 lg:px-11`, as a shared component or token. This replaces per-page `calc(100%-3rem)` widths.
- **Type:** body 16px; minimum 12px; headings on the Tailwind text scale (app h1 `text-3xl` → `lg:text-4xl`, h2 `text-xl` → `md:text-2xl`). Marketing display headings: h1 `text-4xl` → `md:text-5xl` → `lg:text-6xl`, section titles `text-2xl` → `md:text-3xl`. No `clamp()` and no arbitrary rem/px text or spacing.
- **Viewport units:** `dvh`/`svh`, never `vh`.
- **Viewport and safe areas:** explicit `viewport` export in `app/layout.tsx` with `viewportFit: "cover"`, zoom left enabled. Sheet footers, drawer bottom, sticky bars and toasts pad with `env(safe-area-inset-*)`.

## 2. Shared patterns

- **Tap targets:** at least 44px for every interactive element below `lg` (Button base `min-h-11`, compact 36–40px only from `lg`, icon buttons 44×44, standalone links padded to 44px, checkboxes and radios at least 20px with the whole label tappable).
- **Inputs:** all text inputs, selects and textareas are `text-base` (16px) at every width. This fixes `authInputClass` and the plans `fieldControl`.
- **Dialog:** one shared `Dialog`. Below `sm` it is a bottom sheet (rounded top, pinned title and 44px close button, scrolling body, sticky primary-action footer above the keyboard and home indicator, max height in `dvh` minus the top safe area). From `sm` it is today's centred modal. The booking dialog uses the same component at near-full height.
- **Pickers:** native `<input type="date" min>` and a `<select>` for the three time slots. Delete `date-picker.tsx`, `time-picker.tsx`, `picker-trigger.tsx` and the day-picker dependency if nothing else uses it.
- **Photos:** plain file input without `capture` (camera and gallery both offered); thumbnails about 72px in a wrapping grid with a 44px remove button; the 5 photos / 5 MB limits are unchanged.
- **Forms:** one column below `sm`; labels above fields; errors under the field via `aria-describedby`; the primary action is full width on phones and sits in the sticky footer for sheets and long forms; correct `type`, `inputmode` and `autocomplete` for phone keyboards.
- **Toasts:** positioned above the safe area.

## 3. Navigation shell (client and specialist)

- Below `lg`: top bar with hamburger (44px), brand, avatar. The hamburger opens a left drawer (about 82% width, max 320px) with the role's navigation items (from `ROLE_NAVIGATION_MAP`) and the account block (name, role, logout). Logout must be reachable here.
- From `lg`: today's sidebar with the collapse toggle (the toggle exists only from `lg`).
- 640–1023px uses the phone layout with a centred max-width content column and multi-column grids only where cheap.
- Shared `PageHeading`: below `md` only the h1 plus a full-width 44px primary button (eyebrow and description hidden); from `md` today's layout.

## 4. Client workspace

- **Dashboard:** order unchanged (active service, quick booking, subscription and property, recent activity). Quick-booking tiles are 2 columns at phone, 3 from `sm`, 6 from `lg`. Cards stack at full width. No floating action button: "Нова заявка" lives in the page heading and the quick-booking tiles.
- **Active service card:** horizontal four-segment progress bar showing only the current stage's name and detail (other stage names are screen-reader only until `md`). The primary action (confirm) is a full-width 44px button at the bottom; "report issue" is a secondary full-width button below it. The `#id` moves to the secondary line.
- **Request list:** one card per request (service and amount header, date and status badge, stacked full-width 44px actions with the primary first), newest first. `#request-…` anchors keep working. No expand/collapse. Today's row layout from `md`.
- **Report an issue:** the `window.prompt` is replaced by the shared bottom-sheet Dialog (labelled textarea, hint, sticky submit). Rating stays inline with five star buttons of at least 44×44 and a visible selected state. Confirm stays dialog-free.
- **Plan view:** tier cards stacked in one column, recommended first, no horizontal scroll or carousel. Padding `p-5` → `sm:p-8`; metric grids 1 column → 2 columns from `sm`; plan name and status badge stack; subscribe and manage buttons full width. The tier grid no longer uses `minmax(320px,1fr)`.
- **Profile:** the sticky save bar stays, rebuilt mobile-first with safe-area padding.

## 5. Specialist workspace

- **Dashboard order** below `lg`: summary, daily agenda, then opportunities (still limited to 5, with the existing "view all" link). Desktop order is unchanged, done with `order-*` utilities.
- **Summary:** two stat tiles side by side in a 2-column grid at every width (large number, label at least 12px). The history link is a full-width 44px row below on phones and inline from `md`.
- **Job card:** same pattern as the client request cards (service and amount header; date, time and status badge; address; client line; admin badges wrap under the status; the issue banner with its red left border above the actions; stacked full-width 44px actions, primary first).
- **Call and navigate:** the client phone is a 44px "Обади се" `tel:` button; the address is a tappable Google Maps search link. No in-app map and no geolocation.
- **Report sheet:** shared bottom sheet at near-full height. An outside tap does not close it, only the 44px ✕. Closing with typed text or photos asks "Отхвърляне на отчета?" (keep editing is the default). The submit button is sticky above the keyboard and safe area.
- **Opportunity feed:** stacked full-width 44px actions, "Приеми" first and "Пропусни" secondary below; the urgent badge first; same card on the Opportunities page.
- **History and profile pages:** shared conventions only.

## 6. Auth

- **Frame:** below `sm` no card chrome (no border, shadow or rounding); the form sits on the page background with the 16px gutter (about 328px fields at 360, versus about 228px today). The landing header is replaced by a slim bar (brand and "← Към началото") with a one-line footer. From `sm` the centred card with the landing header and footer returns. `vh` min-heights become `dvh`.
- **Signup wizard:** below `sm` the step indicator is one line ("Стъпка 1 от 2 · <title>") over a two-segment progress bar, the title doubling as the step h2. Role tabs are 44px. On both steps the primary button is full width on top and "Назад" is a full-width secondary below. The client form stays one page.
- **Social buttons:** the non-functional Google and Apple buttons and the "или продължете с" divider are removed at every size until real sign-in exists.
- **Login and fields:** 44×44 password toggle; remember-me and forgot-password on one row with 44px tap heights, wrapping if needed; terms checkbox at 20px with a full-label hit area; `autocomplete` of `username` / `current-password` / `new-password`; `enterKeyHint` of `next`, and `done` on the last field; no sticky submit on auth forms; full-width submit; field gaps of at least 16px; error banner above the form and field errors under their fields.
- **Other auth pages:** forgot, reset and pending-approval use the same frame. The pending-approval summary becomes stacked rows (label above value) below `sm`, with full-width 44px logout and back buttons. Reset-link-invalid is a centred message with one full-width button.

## 7. Public pages

- **Header and footer:** one shared site header replaces the landing and plans copies. Below `lg` it is a slim 56px sticky bar (hamburger, brand, primary "Регистрация"). The hamburger opens the same drawer pattern with the anchors (Как работи, Услуги, ЧЗВ, Контакти) and "Вход". The logged-in plans variant shows "Към таблото" and "Моите заявки" in the drawer. From `lg` it is today's horizontal header. Footers are merged into one shared component. The auth slim bar is this header's minimal variant.
- **Landing:** no redesign beyond the conventions: single column, 48px section rhythm (`py-12`, larger from `md`), full-width 44px hero and final call-to-action buttons, decorative hero art hidden on phones, FAQ as a native accordion with 44px rows, no sticky bottom call to action.
- **Plans configurator:** below `lg` a sticky bottom bar (safe-area padded) shows the live price and "Заявете старт", which opens the request form in the shared bottom sheet. The inline summary card stays, and the bar hides while the sheet is open. Controls follow the shared patterns (44px stepper buttons, 16px inputs). The right column is sticky from `lg` as today.
- **Contact:** one column below `lg`, with the contact methods first as full-width 44px-plus `tel:` and `mailto:` rows, then the explanatory card. Buttons are full width and stacked. No fixed hero min-height except where `dvh`-based. Two columns from `lg`.

## 8. Build order (for `/to-spec` and `/to-tickets`)

1. **Mobile-first sweep** (conventions): rewrite all non-admin surfaces onto the Tailwind scale, remove the `shell-*` variants and arbitrary `max-[Npx]` classes, add the lint/grep guard, add the container component and the viewport export.
2. **Shared primitives:** the Button and input sizing, the Dialog sheet, and native pickers (delete the custom ones).
3. **Navigation shell:** the drawer shell for client and specialist, and the shared `PageHeading`.
4. **Shared site header and footer** (public and the auth slim variant).
5. **Surfaces**, in this order: client workspace, specialist workspace, auth and signup wizard, public pages and the plans sheet.

## 9. Verification

By the owner, in browser dev tools and on real phone widths: design for 360 and check at 360, 390 and 768. No new E2E or Playwright tests (AGENTS.md). Unit tests are welcome where logic is pulled out. `npm run check` and `npm run build` must pass for each ticket.
