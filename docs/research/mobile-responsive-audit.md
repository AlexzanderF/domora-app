# Mobile responsive audit (non-admin surfaces)

Answers #192 (parent map #188). Read-only audit of `src/` and `src/app/globals.css` at commit `4fa249c`. Everything below comes from reading the code. Nothing was rendered, so "at 360/390/768" means what the class names compute to at those widths. Verify in a browser before acting on the medium-severity items.

## 1. How responsiveness is built today

- **No Tailwind breakpoint scale in use.** `sm:/md:/lg:/xl:` appear nowhere in non-admin code. `max-md:` appears only in `src/features/admin/*` (12 uses). Everything else uses arbitrary max-width variants, desktop-first: `max-[700px]:` (82 uses), `max-[560px]` (23), `max-[620px]` (21), `max-[850px]` / `max-[820px]` (16 each), `max-[520px]` (13), plus 10 more one-off values (420, 600, 640, 800, 900, 960, 980, 1050, 1080, 1100). Roughly 20 distinct breakpoints. No two surfaces share a convention. (grep over `src/**/*.tsx`)
- **Shell variants** (`src/app/globals.css` lines 10-11): `shell-tablet` = `max-width:1100px`, `shell-phone` = `max-width:700px`. Both are inclusive. They are used only by `components/layout/workspace-shell.tsx` and `components/layout/sidebar.tsx` (33 `shell-phone:` + 9 `shell-tablet:` uses). Marketing, auth and feature code do not use them and hardcode `max-[700px]` instead.
- Only responsive CSS in `globals.css` is `@media (max-width:700px) { h1 { font-size: 29px } }` (base layer). `h1` is 34px/29px, `h2` 23px, fixed (no clamp).
- No `dvh`/`svh`/`env(safe-area-*)` anywhere. Viewport meta is Next's default (no explicit `viewport` export in `app/layout.tsx`).
- Base-layer `input/select/textarea` are `font-size:16px`, width 100%. `button, a, select` get `touch-action: manipulation`.
- **No tables** exist in non-admin UI. Lists are flex/grid rows, so table overflow is not a concern outside admin.

## 2. Shared hotspots (fix once, helps many surfaces)

1. **Workspace shell + sidebar** (`components/layout/workspace-shell.tsx`, `sidebar.tsx`). Wraps every client and specialist page.
   - At `<=700px` the sidebar becomes a static, non-sticky block on top of the page and its nav becomes a horizontal scroller (`overflow-x-auto`, scrollbar hidden, no scroll affordance). It scrolls away with the page, so there is no persistent navigation. Items are ~34px tall at 13px type.
   - **The header, which holds `HeaderAccount` (name, role, Изход), is `shell-phone:hidden`. Logout is not rendered anywhere else for workspace users on phones** (verified: the only other `logout` UI is `pending-approval-card.tsx`).
   - At 701-1100px (including 768) the sidebar stays a fixed 250px (or 72px if collapsed) beside the content, leaving about 462px of usable content at 768 after `p-7`. The sidebar switches to the phone layout 68px above 768. The tablet layout is a squeezed desktop layout, not a tablet layout.
   - `main` uses `min-h-[calc(100vh-130px)]`, `shell-phone:min-h-[65vh]`. The sidebar collapse button is 24px (hidden on phone).
2. **`components/ui/dialog.tsx`** (also used by booking dialog and specialist report dialog). `fixed top-1/2 left-1/2 -translate-*`, `max-h-[90vh]`, `w-[min(650px,94vw)]`, `overflow-y-auto`, `p-7` (`p-[22px]` at <=700). It uses `vh`, so on mobile browsers the dynamic toolbar and the on-screen keyboard can push the bottom out of view. There is no bottom-sheet pattern.
3. **`components/ui/card.tsx`**. `p-6`, `max-[700px]:p-5`. Callers frequently override this with their own `max-[700px]:p-*` (client-plan-view even sets `max-[700px]:p-8`, i.e. no reduction).
4. **`components/ui/button.tsx`**. Default `px-[19px] py-3` font-semibold with no min-height. Many call sites override to `px-3 py-[7px] text-sm` (`requests/request-actions.tsx`, `specialist/section-parts.tsx` `actionButton`), which yields ~34px-high buttons. Others add `min-h-[42px]`/`min-h-11`. Nothing enforces 44px.
5. **Auth input primitives** (`features/auth/auth-ui.tsx`): `authInputClass` sets `text-[15px]`, inherited by `AuthInput`, `AuthSelect`, `AuthTextarea`, `PasswordInput`. Inputs under 16px trigger iOS Safari focus-zoom. The same applies to the plans form `fieldControl` (`text-[0.92rem]` ≈ 14.7px, `plans-configurator.tsx` line 69). Booking dialog fields and `components/ui/input.tsx` (`text-base`) are fine.
6. **Header duplication.** `landing/landing-header.tsx` and `plans/plans-header.tsx` are near-identical copies of the same nav (same `max-[700px]` / `max-[850px]` classes). Footers (`landing-footer`, `plans-footer`) are likewise separate. Fixing one leaves the other.
7. **Page-level width/gutter idiom repeated per page**: `w-[min(1180px|1240px|1320px,calc(100%-3rem))]` plus `max-[520px|560px]:w-[calc(100%-2rem)]` (plans page, contact, landing header). The auth layout and shell each hand-roll the same `min-h-[calc(100vh-130px)]` + `max-[700px]:min-h-[65vh]`.
8. **`components/page-heading.tsx`**. Stacks at <=700; `h1` margin/size come from global base.

## 3. Per surface

Legend: OK = no breakage expected; RISK = likely visual problem; SMALL = tap target / type size.

### Landing (`features/landing/*`, `app/page.tsx`)
- Header (`landing-header.tsx`): at <=850 the nav links move to a second row (header becomes about 120px tall and `sticky`, so it eats ~1/3 of a 360x640 viewport). At <=700 the `<nav>` itself is `overflow-x-auto` (scroll container around the whole header, which can also clip focus rings). Anchor links have `p-0` and 13-15px text with no min-height, giving ~20px tall tap targets (SMALL). Login/Register are 38-42px tall.
- Hero: `grid-cols-[minmax(0,1.35fr)_minmax(250px,0.65fr)]` collapses via `max-[1050px]`, decorative art hidden. h1 uses `clamp`. CTAs `min-h-[50px]`. OK at 360/390/768.
- Services, how-it-works, trust/FAQ (`max-[850px]:grid-cols-1`), footer (2 cols <=850, 1 col <=560). OK. `service-showcase.tsx` has two `min-w-[210px]` chips; two fit side by side down to ~448px and are presumed to wrap (check `flex-wrap`, not confirmed).

### Plans (`app/(marketing)/plans/page.tsx`, `features/plans/*`)
- Two-column configurator and `home-plan-preview` collapse at `max-[820px]`; summary `sticky top-[100px]` becomes static. OK at 768 and below.
- Page uses `min-h-[calc(100vh-76px)]` (vh).
- 3-up quick-visit buttons `grid-cols-3`, `min-h-24` at <=520; OK. Stepper is `grid-cols-[40px_46px_40px]`, 40px wide targets (SMALL, borderline).
- Form controls are 14.7px (iOS zoom, see hotspot 5).
- Date picker (`date-picker.tsx`): popover `w-[min(280px,calc(100vw-3rem))]`, absolutely positioned `right-0` under the trigger; day cells and prev/next buttons are `size-[1.9rem]` = 30px (SMALL; the main tap-target offender in the app). Time picker options `min-h-[38px]`. `PickerTrigger` `min-h-11` OK.
- Both pickers are absolutely positioned popovers, not sheets. Inside the booking dialog they are children of an `overflow-y-auto` container, so the popover extends the dialog scroll area rather than overlaying it (RISK, verify).
- `plans-header` / `plans-footer`: same as landing header (hotspot 6).

### Auth + signup wizard (`app/(auth)/layout.tsx`, `features/auth/*`)
- Layout card `max-w-[480px]`, padding `px-11` -> `p-7` (<=1100) -> `px-[18px]` (<=700), inside an `px-4` wrapper. About 292px content width at 360. `min-h-[calc(100vh-130px)]` / `65vh`.
- Inputs 15px (iOS zoom). Password toggle button is ~30px tall (SMALL). Checkbox 18px (SMALL; label is clickable, so partly mitigated).
- Social buttons `grid-cols-2 max-[420px]:grid-cols-1`: OK. Login row "remember me / forgot" `justify-between` with `whitespace-nowrap` link: should fit at 292px but is tight.
- Wizard role tabs (`signup-wizard.tsx` ~286) `flex` two tabs: OK. `specialist-step-indicator.tsx`: two `flex-1` steps with 26px circle plus 13px text "Стъпка 1: Данни за профила" / "Стъпка 2: ...", no `min-w-0`, no responsive variant. At 360 each step has about 130px, so the text wraps to 2-3 lines (RISK).
- `pending-approval-card.tsx`: `max-w-[60%]` value column with `break-word`: OK.

### Client workspace (`app/(workspace)/client/*`, `features/client-dashboard`, `requests`, `subscriptions`, `client-profile`)
- `client-dashboard.tsx` has the most responsive code in the app (12 breakpoint uses, mostly `max-[620px]`/`max-[960px]`). Quick-action grid 6 -> 3 -> 2 columns. Tracker is 4 columns -> 1 column at <=620. Between 621 and 768 the shell is still tablet layout (462px content) with 4-col tracker and 2/3-col grids: tight but workable. 10-11px labels (`text-[0.68rem]`, `0.69rem`) are SMALL (27 uses of <12px type in non-admin code, mostly here, the sidebar tagline (9-10px) and plans).
- **`client-plan-view.tsx` line 415: `grid-cols-[repeat(auto-fit,minmax(320px,1fr))]` with `TierCard` padding `p-8` (not reduced on phone).** At 360, main content is 324px, the card inner width is 324-64=260px, so 320px min tracks overflow the container horizontally (RISK, high confidence). Also check the `minmax(260px,1fr)` grid on line 302 which only just fits at 360, and the `minmax(200px,1fr)` grid at 251.
- `client-profile-form.tsx`: sticky save bar `-mx-6` with phone override `-mx-[1.15rem]` matching `max-[700px]:p-[1.15rem]`; 2-col -> 1-col at 700. Button `max-[700px]:w-full`. OK. Profile page grid `minmax(280px,0.75fr)` collapses at 980. OK.
- `request-list.tsx` rows: icon 42px + flexible text (`[overflow-wrap:anywhere]`) + `whitespace-nowrap` amount; amount shrinks to 16px at <=700. At 360 text column is about 190px: OK but narrow. Action buttons wrap (`flex-wrap`) and are ~34px tall (SMALL).

### Specialist workspace (`app/(workspace)/specialist/*`, `features/specialist/*`)
- Almost no own breakpoints; relies on `flex-wrap`, `min-w-[180px]` cards (`dashboard-summary.tsx`: wrap to one per row at 360, OK) and the shared `section-parts.tsx` row (same structure as request-list). Report dialog uses shared `DialogContent`. Status/action buttons ~34px (SMALL). No tables.
- The "История & приходи" link is `whitespace-nowrap`: fine.

### Booking dialog, pickers, photo picker (`features/bookings/*`, `features/plans/*picker*`)
- `booking-dialog.tsx`: `w-[min(720px,94vw)]`, `max-h-[min(96vh,820px)]`, padding 22 -> 18 at <=640. Field grid 2 -> 1 col at <=640. Quote box stacks at <=640. Centered modal, scrollable inside, `vh`-based (see hotspot 2). On a 360x640 iPhone with keyboard open the usable height can be about 300px. Close button is 34x34 (SMALL).
- Native `<select>` for category/service: good mobile behaviour. Fields are 16px (global base).
- `photo-picker.tsx`: native `<input type="file">` (OK, native picker), previews `size-[54px]` wrap. No camera `capture` hint (not a responsive issue).
- Date/time pickers: see Plans (30px day cells, popovers).

### Contact (`app/contact/page.tsx`)
- Uses `min-h-[calc(100vh-130px)]`, `grid-cols-[minmax(0,1fr)_minmax(360px,0.62fr)]` which collapses to 1 col at `max-[900px]`. At 901-1000px the right column's 360px minimum is tight but fits. OK at 360/390/768. Hero block `min-h-[min(620px,calc(100vh-78px))]` reset at <=900.

## 4. Summary by width

- **360**: main breakages are `client-plan-view` tier grid overflow, no logout, phone nav that scrolls away, wizard step indicator wrapping, 30px date-picker cells, `vh`-based dialogs/min-heights.
- **390**: same as 360, except the tier grid overflows by about 30px (290px available vs 320px minimum) instead of 60px.
- **768**: not "mobile" to the shell (>700), so it gets the squeezed desktop layout (250px sidebar, 462px content). Landing/plans/contact/auth collapse correctly at this width (their breakpoints are 820-900); the workspace is the only surface whose behaviour at 768 is questionable.

## 5. Suggested directions for #191 (not implemented)

1. Pick one breakpoint set and one idiom (Tailwind `max-*`/`sm` or the existing `shell-*` custom variants) and migrate the ~20 ad-hoc values towards it.
2. Rework workspace shell phone layout: sticky top bar or bottom tab bar, put account/logout back in it, decide what 701-1100 does with the sidebar (collapse by default below ~900).
3. Make `dialog.tsx` mobile-aware: `dvh`, full-width bottom sheet or full-screen at phone, with the booking dialog and pickers on top of it.
4. Shared form/tap-target tokens: 16px inputs everywhere (`authInputClass`, `fieldControl`), a 44px minimum on `Button` size variants, bigger date-picker cells.
5. De-duplicate landing/plans headers and footers.
6. Fix `client-plan-view` grids (`minmax(min(320px,100%),1fr)`) and the specialist step indicator.
