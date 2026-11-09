# 6. Modular Monolith with Framework-Free Domain Modules and a Worker

DOMORA stays one Next.js codebase. Business rules move out of `src/features/*/server/actions.ts` into framework-free modules under `src/domain/<module>/` that never import `next/*`. Server Actions, Route Handlers and the worker are thin adapters over them.

## Modules and dependency direction

`pricing` (pure; merges the three existing pricing files), `requests` (lifecycle state machine; sole writer of `requests.status`), `dispatch` (assign, recommend, accept/decline), `disputes` (confirm/rate, raise issue, admin resolve), `subscriptions` (plan and visit accounting), `identity` (users, sessions, specialist approval), `authz`.

`dispatch` and `disputes` depend on `requests`; `requests` depends on `pricing` and `subscriptions` (explicit call to consume a visit); nothing depends on `dispatch` or `disputes`. Modules call Drizzle directly; there are no repository ports.

## Authorization

`authz` exposes a pure `can(actor, action, resource)`. Every domain function takes an `Actor` first and enforces it itself, so no adapter can skip it. Adapters only resolve cookie/token to an `Actor`.

## Side effects

Every state change inserts a versioned event (e.g. `request.completed`) into an `outbox_events` table in the same transaction. A separate worker process delivers from the outbox and runs scheduled jobs (e.g. photo retention sweep).

## Worker

`worker/index.ts` in the same repo, same Docker image, second Compose service. It shares `src/domain` and `src/db` via the `@/*` alias and needs its own build step (tsx/esbuild). Job runner choice is deferred to the notifications ticket.

## Conventions kept cheap for later

Domain functions return serializable DTOs, not Drizzle rows; auth resolution lives in one adapter. SSE and `/api/v1` are not part of the initial release and nothing is built for them beyond these conventions and the outbox.

## Migration

Module by module, one PR each: `pricing`, then `requests` + `authz`, then `dispatch` and `disputes`, then `subscriptions` and `identity`.

## Considered alternatives

Keeping `features/*/server` and extracting only pure rules (leaves auth and persistence tangled in actions); repository ports (abstraction with one database and one team); fire-and-forget notifier without an outbox (lossy, no path to live updates).
