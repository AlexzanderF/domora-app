# DOMORA

Bulgarian home-services application built with **Next.js App Router, React and strict TypeScript**, backed by Postgres (Drizzle) with a separate worker process for notifications. It is in **private beta**: see [Current scope](#current-scope).

## Start developing

Use Node.js 24 (see `.nvmrc`), npm and Docker (for the local Postgres).

```bash
git clone https://github.com/AlexzanderF/domora-app.git
cd domora-app
nvm use
npm ci
cp .env.example .env          # the defaults work for local development
docker compose up -d db       # Postgres on 127.0.0.1:5432
npm run db:migrate
npm run db:seed               # tariffs plus demo users and requests
npm run dev
```

Open [localhost:3000](http://localhost:3000). The development seed creates demo accounts (for example `client@domora.bg` and `admin@domora.bg`, password `password`); see `src/db/seed.ts`. Emails are logged by the worker, not sent; run it with `npx tsx worker/index.ts` when you need to see them.

## Project structure

```text
src/
  app/                    Next.js routes, layouts and Route Handlers
    (auth)/               Login, signup, pending approval
    (marketing)/          Public plans page
    (workspace)/          Authenticated client, specialist and admin areas
    api/                  Health, logout, photo upload and photo serving
  components/             Shared layout shell and UI primitives
  db/                     Drizzle schema, migration runner and seed
  domain/                 Framework-free business rules (no next/* imports):
                          authorization, requests, dispatch, disputes,
                          subscriptions, identity, pricing, notifications, photos
  features/               UI and Server Actions per feature (thin adapters)
  lib/                    Shared formatting utilities
worker/                   Outbox delivery and scheduled jobs (own process)
drizzle/                  SQL migrations
caddy/, compose.yaml      Production topology
docs/                     ADRs, deploy runbook, agent guidelines
tests/e2e/                Playwright user-flow tests
```

Routes and layouts are Server Components; interactive controls are small Client Components. Business rules live in `src/domain/<module>`: every domain function takes an `Actor` first and enforces it through the single `can(actor, action, resource)` policy, so Server Actions, Route Handlers and the worker only parse input, resolve the actor and map the result (see [ADR 0006](./docs/adr/0006-modular-monolith-and-worker.md)).

## Commands

| Command              | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Start development with Fast Refresh                |
| `npm run build`      | Build the standard Next.js application             |
| `npm start`          | Serve the production build                         |
| `npm run check`      | Lint, type-check, check formatting, run unit tests |
| `npm run format`     | Format source files                                |
| `npm run test:watch` | Watch unit tests during development                |
| `npm run test:db`    | Start the test Postgres and run DB-backed tests    |
| `npm run test:e2e`   | Run desktop and mobile Chromium user flows         |

### DB-backed tests

Files named `*.db.test.ts` run against a real Postgres, separately from `npm test`. `npm run test:db` (needs Docker running) starts a throwaway Postgres from `compose.test.yaml` (port 5433, data in tmpfs), applies the migrations, truncates every table before each test, and runs them; `npm run test:db:down` stops it. Set `TEST_DATABASE_URL` to use another database (its name must end in `_test`); CI does this with a Postgres service. Example: `src/features/admin/server/metrics.db.test.ts`.

Before running browser tests for the first time:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

Playwright starts the production server automatically. GitHub Actions runs `npm run check`, the DB-backed tests and the production build on pull requests and on pushes to `main`; the browser tests are currently not run in CI.

## Collaborating

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the branch and review workflow. Commit source and `package-lock.json`; never commit `node_modules` or `.next`. Use `npm ci` for reproducible installs.

## Current scope

DOMORA is a **private beta**: real data and real accounts, on one server, for a small number of users. Until the [hard gates](./docs/deploy-runbook.md#hard-gates-before-inviting-external-users) are met it runs as plain HTTP on the server IP for the owner only.

Shipped:

- **Accounts and access.** Clients, specialists and administrators sign in with a server-side session. Role and status are read from the database on every request, and each area (client, specialist, admin) is guarded on the server. Specialists sign up as Pending and can see or claim nothing until an administrator approves them.
- **Requests.** Bookings are stored in Postgres and priced from the tariffs in the database. The lifecycle (accept, start, completion report, confirm and rate) is enforced on the server for the right actor, and every change is recorded in an audit trail.
- **Dispatch.** Active specialists see opportunities matching their trade and area; a request can be claimed by only one of them. Administrators can recommend a request to a specialist, and the recommendation records who made it and when.
- **Disputes.** A client can raise an issue with a note on completed work; administrators triage and resolve it, and the history is kept after resolution.
- **Subscriptions.** The plans configurator creates a real subscription, with visits and validity tracked.
- **Photos.** Clients attach up to 5 photos to a booking and specialists attach photos to the completion report (JPEG, PNG or WebP, 5 MB each, 15 MB per request). They are re-encoded on the server, which strips EXIF/GPS, stored on a Docker volume and served only through the authenticated `/api/photos/[id]` route to the request's client, its assigned specialist and administrators. Uploads never attached to a request are deleted after 24 hours.
- **Email notifications.** Key events (specialist signup and approval, urgent unassigned requests, new opportunities, recommendations, acceptance, completion report, issues and their resolution) are written to a transactional outbox and delivered by the worker in Bulgarian, with up to 5 attempts. Administrators see deliveries that still failed at `/admin/notifications`. The default `console` driver only logs; the `resend` driver sends real email once a sending domain is verified.
- **Operations.** One Docker image, Compose with Caddy, migrations before start, deploy on every merge to `main` and rollback by commit SHA.

Not in the beta:

- Payments. The beta is billed offline.
- Password reset. The "forgotten password" form does not send an email or change a password yet.
- SMS, push and in-app notifications; email verification, preferences and unsubscribe.
- Live updates, a mobile app and a public API.
- Login rate limiting and expiry sweeps for sessions.
- Monitoring and error reporting, and the privacy and terms documents needed before a public launch.
- Automatic deletion of photos after a retention period (pending legal confirmation).

The optional browser booking tool opens the booking form; it never submits a request.

## Hosting

DOMORA runs on a single server with Docker Compose: Postgres 16, one-shot migrations, the Next.js `web` server, the `worker` and Caddy at the edge. Every merge to `main` builds one image and deploys it.

**The [deploy runbook](./docs/deploy-runbook.md) is the reference** for server setup, deploy and rollback, the SSH tunnel to Postgres, first-admin bootstrap and seed, backups and restore, and the hard gates that must be met before any external user is invited.

To run the full stack locally:

```bash
cp .env.example .env   # fill in POSTGRES_PASSWORD at least
docker compose up -d --build
```

Photos go to the `photos` Docker volume under Compose and to `.data/photos` with `npm run dev`. Never run `docker compose down -v` unless you mean to delete the database and every photo.

## Seed data

`npm run db:seed` writes only what the environment allows:

| Mode                                  | Reference data (tariffs) | First admin      | Demo users, subscriptions, requests      |
| ------------------------------------- | ------------------------ | ---------------- | ---------------------------------------- |
| Development, local database (default) | yes                      | if `ADMIN_*` set | yes                                      |
| Development with `--reference-only`   | yes                      | if `ADMIN_*` set | no                                       |
| `NODE_ENV=production`                 | yes                      | if `ADMIN_*` set | **never** (`--demo` exits with an error) |

Bootstrapping the first admin on a production server is described in the [deploy runbook](./docs/deploy-runbook.md#first-admin-and-seed).
