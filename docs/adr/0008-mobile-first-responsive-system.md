# 8. Mobile-First Responsive System

Most DOMORA users are on phones, so every non-admin screen is designed phone-first. Unprefixed Tailwind classes are the phone layout, and `sm:` / `md:` / `lg:` add to it. This ADR records the choices that are costly to reverse. The full per-surface behaviour is in [`docs/specs/mobile-responsive.md`](../specs/mobile-responsive.md).

## Why

The workspace shell becomes a non-sticky stack on phones, and the header holding logout is hidden below 700px. Roughly 20 ad-hoc desktop-first breakpoints (`max-[700px]` alone appears 82 times) and two custom `shell-*` variants coexist with no shared convention. Dialogs, pickers, tap targets and input sizes were never sized for touch (30–34px targets, inputs under 16px that make iOS zoom on focus). Auth forms are only about 228px wide at 360px.

## Decisions

- **Mobile-first on Tailwind's standard scale only** (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). No custom breakpoints. The minimum supported width is 360px.
- **Drawer navigation on phones.** A hamburger opens a left drawer holding the navigation items and the account (name, role, logout). The drawer is used below `lg`, and the sidebar from `lg`. There is no separate tablet layout: 640–1023px reuses the phone layout with a centred, max-width content column. A bottom tab bar and a hybrid were prototyped and rejected.
- **Migration is all at once.** One up-front sweep rewrites every non-admin surface mobile-first, deletes the `shell-tablet` / `shell-phone` variants and all arbitrary `max-[Npx]` classes, and adds a lint/grep guard against reintroducing them. The sweep keeps today's behaviour; per-surface redesign lands on top of it.
- **Native date and time controls.** `<input type="date" min>` and a `<select>` for the three time slots replace the custom pickers, which are deleted.
- **One shared Dialog** that is a bottom sheet below `sm` and a centred modal from `sm`.
- **Touch rules.** Interactive elements are at least 44px below `lg`; text inputs are `text-base` (16px) at every width; nothing under 12px; `viewportFit: "cover"` with safe-area padding; `dvh`/`svh` instead of `vh`.
- **Admin, offline, PWA are out of scope.**

## Considered alternatives

- **Bottom tab bar or hybrid navigation:** reachable, but the owner preferred the drawer after a prototype, and it fits both roles' four items plus the account and logout.
- **Keeping the `shell-*` variants and max-width idiom:** desktop-first logic and a second breakpoint vocabulary fight a phone-first goal.
- **Incremental per-surface migration:** avoids a large diff but leaves two idioms in the codebase for the length of the effort. The owner chose one sweep with a guard.
- **Custom pickers in a sheet:** more control over the look, but three fixed slots and a minimum date do not need a bespoke listbox, and native controls bring locale and keyboard behaviour for free.
