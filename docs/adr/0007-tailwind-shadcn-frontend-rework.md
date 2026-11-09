# 7. Tailwind v4 + shadcn/ui Replace CSS Modules

The frontend UI layer moves from per-feature CSS Modules to shadcn/ui (Radix primitives) styled with Tailwind v4. The current look is kept; this is a rebuild of the styling layer, not a redesign.

## Why

About 7,200 lines of CSS across 24 files, built on 8 design tokens and 187 hard-coded colours. Every feature restyles its own buttons, inputs, cards and dialogs, and two auth stylesheets are near-identical copies. Features also import each other freely (including cycles), mostly to reach shared types.

## Decisions

- **Library:** shadcn/ui on Radix, styled with Tailwind v4 through the PostCSS plugin, as in the bundled Next.js 16 CSS guide. Generated primitives live in `src/components/ui/` and are treated as library code (not unit-tested).
- **Current look kept:** existing colours map onto shadcn's semantic tokens (green → `primary`, ink → `foreground`, paper → `background`, line → `border`, accent → `accent`, muted → `muted-foreground`). Hard-coded colours fold into that palette as screens migrate.
- **Dark-ready token names:** no dark theme is built, but tokens use shadcn's semantic names so a dark theme later only defines values.
- **CSS Modules:** removed from app screens. Allowed afterwards only for bespoke marketing-page visuals (hero art, animations).
- **Feature-boundary rule:** dependency direction is app routes → features → shared components (`src/components`) → `src/domain` / `src/lib`. Features may not import other features except through a short allowlist, enforced by ESLint `no-restricted-imports` as part of `npm run check`. Shared types (user, tariffs, requests) live in `src/domain`. Each feature has exactly one owner module.
- **Toasts:** Sonner replaces the hand-rolled toast behind the existing `useToast` API, so call sites do not change.

## Integration-branch workflow

All rework tickets land on `feature/frontend-rework`, cut from `main` after `feature/password-reset-151` merged. This is a deliberate exception to the AGENTS.md rule that PRs target `main`.

- Every ticket PR targets `feature/frontend-rework` and must pass `npm run check` and `npm run build`.
- Tailwind and the old CSS coexist until the contract ticket removes the old global classes and CSS Modules.
- UI changes on `main` are frozen until the end; non-UI changes on `main` are merged into the integration branch in the final ticket.
- The branch merges into `main` once, in a final integrate-and-verify ticket, so `main` never carries a half-migrated UI and stays deployable throughout.

## Considered alternatives

Keeping CSS Modules and only extracting shared tokens (leaves 24 stylesheets and no shared primitives); another component library such as MUI or Chakra (imposes its own look, so "keep the current look" costs more); migrating directly on `main` (half-migrated UI on the deployable branch).
