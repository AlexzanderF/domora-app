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
4. **Generated Files**:
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

## Coding Behavior Guidelines (Karpathy)

Behavioral guidelines to reduce common LLM coding mistakes, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876). These bias toward caution over speed; for trivial tasks, use judgment. The project's Test Authoring Guardrail above takes precedence over any testing advice here.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove imports/variables/functions that YOUR changes made unused; leave pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

- "Add validation" → define the invalid inputs and confirm they are rejected.
- "Fix the bug" → reproduce it, then confirm the fix.
- "Refactor X" → ensure existing tests pass before and after.

For multi-step tasks, state a brief plan with a verification check per step:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently; weak ones ("make it work") require constant clarification.

---

## Context Pointers

Consult these shared reference documents when executing specific branches:

- **Issue & Spec Operations**: When creating, reading, or editing GitHub issues or PRs, follow [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).
- **Issue Triage**: When assigning triage roles or labels to issues, follow [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).
- **Domain Modeling & ADRs**: Before modifying domain entities or glossary terms, consult [`docs/agents/domain.md`](docs/agents/domain.md) and `CONTEXT.md`.
