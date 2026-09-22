<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DOMORA Agent Guidelines

## Project Overview

DOMORA is a property care and home service management web application.

- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Vitest, Playwright.
- **Engine**: Node.js 24 (`>=24 <25`).
- **Language**: Bulgarian (`bg`) for all user-facing copy, labels, placeholders, and feedback messages.
- **Styling**: Vanilla CSS with CSS variables (`src/app/globals.css`) and CSS Modules (`*.module.css`). **Do not use Tailwind CSS**.

---

## Architectural Conventions

1. **Server vs. Client Components**:
   - Default to React Server Components (RSC).
   - Only add `"use client"` at interactive leaf components (event listeners, state, browser APIs).
   - Never expose server secrets or direct mutations in client components.
2. **Directory Structure & Path Aliases**:
   - Path alias: `@/*` maps to `src/*`.
   - Routes: `src/app/(auth)/` (login, signup, approval) and `src/app/(workspace)/` (authenticated client, specialist, admin shells).
   - Shared UI & Layouts: `src/components/ui/` and `src/components/layout/`.
   - Feature Modules: `src/features/<feature-name>/` (colocate UI components, styles, types, and mock stores).
3. **State & Mocking**:
   - Use the demo provider pattern (e.g., `src/features/requests/demo-provider.tsx`) when prototyping interactive flows without a backend.
4. **Domain Literals**:
   - Declare every domain string union (roles, statuses, priorities, plans) once as a const object with PascalCase members, deriving the union type from it (e.g., `RequestStatus.Created` in `src/features/requests/types.ts`).
   - Reference members in all boolean logic, filters, sorts, drizzle predicates, lookup maps, seeds, and fixtures — never raw literals.
   - Key lookup maps with computed member keys and keep them total over the union, so `tsc` enforces exhaustiveness.
   - Raw literals stay only where they define values: `pgEnum` declarations in `src/db/schema.ts`, storage codes, and type-checked test data.
5. **Generated Files**:
   - Do NOT manually edit files in `dist/` or `.next/`.

---

## Verification & Completion Gate

A task is complete only when the primary gate passes cleanly:

- `npm run check`: Primary gate (runs ESLint `--max-warnings=0`, `next typegen && tsc --noEmit`, Prettier check, and Vitest).
- `npm run build`: Verify production build succeeds before committing or opening a PR.
- `npm run format`: Prettier auto-formatter when formatting check fails.

---

## Workflow Guardrails

- **Scope**: Keep changes and PRs tightly focused on the requested task.
- **Feature Isolation**: Work on dedicated feature branches (e.g., `feature/<task-name>`). Avoid editing shared files (`globals.css`, `providers.tsx`) unless strictly necessary.
- **Automated PR Creation**: When completing work on a feature branch, push to `origin` and open a PR against `main` with a clear summary of changes, problem addressed, and verification results.
- **Test Authoring Guardrail**:
  - Focus strictly on direct production implementation.
  - Verify that existing tests pass, but **do not write, generate, or add new tests** (unit, integration, Playwright, or E2E) unless explicitly requested by the user.
  - Do not create or edit files in `tests/e2e/`.
  - When breaking down specs or tickets (via `/to-spec`, `/to-tickets`, etc.), do not include test writing or testing seams in the acceptance criteria or task breakdown.

---

## Context Pointers

Consult these shared reference documents when executing specific branches:

- **Issue & Spec Operations**: When creating, reading, or editing GitHub issues or PRs, follow [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).
- **Issue Triage**: When assigning triage roles or labels to issues, follow [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).
- **Domain Modeling & ADRs**: Before modifying domain entities or glossary terms, consult [`docs/agents/domain.md`](docs/agents/domain.md) and `CONTEXT.md`.
