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
- **UI & Language**: Bulgarian (`bg`) for all user-facing copy, labels, placeholders, and feedback messages. Keep tone and vocabulary consistent with existing components.

---

## Architectural Conventions

1. **Server vs. Client Components**:
   - Default to React Server Components (RSC).
   - Only add `"use client"` at interactive leaf components (event listeners, state, browser APIs).
   - Never expose server secrets or direct mutations in client components.
2. **Directory Structure**:
   - Routes: `src/app/`
   - Shared UI & Layouts: `src/components/ui/` and `src/components/layout/`
   - Feature Modules: `src/features/<feature-name>/` (colocate UI components, types, and demo data).
3. **State & Mocking**:
   - Use the demo provider pattern (e.g., `src/features/requests/demo-provider.tsx`) when prototyping interactive flows without a backend.
4. **Generated Files**:
   - Do NOT manually edit files in `dist/` or `.next/`.

---

## Verification & Validation Commands

Always run and verify that checks pass before completing tasks:

- `npm run check`: Primary gate (runs ESLint `--max-warnings=0`, `next typegen && tsc --noEmit`, Prettier check, and Vitest).
- `npm run build`: Verify production build succeeds before committing.
- `npm run format`: Format code with Prettier when needed.
  _(Note: Do NOT run `npm run test:e2e` or create Playwright tests unless explicitly instructed by the user.)_

---

## Team Collaboration & Guardrails

- **Feature Isolation**: Work on dedicated feature branches (e.g., `feature/<task-name>`).
- **Shared Files**: Avoid editing `src/app/globals.css` or `src/app/providers.tsx` unless necessary, and keep changes isolated to prevent merge conflicts with teammates.
- **Scope**: Keep changes and PRs tightly focused on the requested task.
- **Automated PR Creation**: When completing work on a feature branch or pushing changes, automatically push the branch to `origin` and open a pull request against `main` containing a clear summary of changes, problem addressed, and verification results.
- **Strict Prohibition on Writing Tests**:
  - Do NOT write, generate, or add ANY new tests (including E2E, Playwright, `*.spec.ts`, unit tests, integration tests, or TDD) on implementations unless explicitly requested by the user.
  - Do NOT create or edit files in `tests/e2e/`.
  - When breaking down specs or tickets (via `/to-spec`, `/to-tickets`, etc.), do NOT include test writing or testing seams in the acceptance criteria or task breakdown.
  - Focus solely on direct implementation and verifying that existing tests, type checks, and production builds pass.

---

## Available Skills

- **/grill-me** (`.agents/skills/grill-me/SKILL.md`): When requested (or invoked via `/grill-me`), interview the user one question at a time with recommendations to stress-test plans, edge cases, and architecture before writing code.

---

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues for `AlexzanderF/domora-app`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical five-role triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repository layout (`CONTEXT.md` at root). See `docs/agents/domain.md`.
