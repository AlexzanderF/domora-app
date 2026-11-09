# DOMORA

Bulgarian home-services application built with **Next.js App Router, React and strict TypeScript**. The existing prototype has been migrated into routes and feature modules, preserving its design and demo workflows.

## Start developing

Use Node.js 24 (see `.nvmrc`) and npm. No environment variables or external services are needed for the demo.

```bash
git clone https://github.com/ivanlipev15-ops/domora-app.git
cd domora-app
nvm use
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). If you do not use nvm, install Node.js 24 directly.

## Project structure

```text
src/
  app/                    Next.js routes, layouts, metadata and global styles
    page.tsx              Home (/)
    requests/             Requests (/requests)
    plans/                Subscriptions (/plans)
    specialist/           Demo specialist workspace (/specialist)
    admin/                Demo admin workspace (/admin)
  components/
    layout/               Shared navigation and application shell
    ui/                   Shared page heading and toast notifications
  features/
    bookings/             Booking dialog, photo previews and browser tool
    plans/                Subscription cards
    requests/             Types, demo state, pricing, lifecycle and request UI
    services/             Service catalog and category UI
    workspace/            Staff statistics and tariff editor
  lib/                    Shared formatting utilities
tests/e2e/                Desktop and mobile user-flow tests
.github/workflows/       Pull request and main-branch checks
```

Route files and the shared layout are Server Components. Interactive controls are small Client Components. The root demo provider retains requests and tariffs while navigating with Next.js links. React renders user input as text; there is no HTML string rendering or global click handler.

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

Playwright starts the production server automatically. GitHub Actions runs the checks, production build, and browser tests on pull requests and pushes to `main`.

## Collaborating

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the branch and review workflow. Commit source and `package-lock.json`; never commit `node_modules` or `.next`. Use `npm ci` for reproducible installs.

## Current scope

This is a working frontend foundation with **demo data**, not a completed production service:

- Requests and tariffs live in React memory and reset on refresh. They are not shared between users or tabs.
- The client/specialist/admin selector is for demonstrations. `/admin` and `/specialist` are public demo pages, with no authentication or server authorization.
- Photo selection produces local previews only; photos are not uploaded or saved.
- Booking, completion, ratings and issue reports do not contact a real specialist. There are no payments or notifications.
- The optional browser booking tool opens the form; it never submits a request.

For production, replace `features/requests/demo-provider.tsx` with authenticated server-backed data access, add database migrations and server-side input/permission checks, then connect upload storage and payments as separate features. Keep pricing and request lifecycle rules covered by tests; client-side role checks are not a security boundary.

## Hosting

DOMORA runs as a single Next.js server (`npm run build` / `npm start`). The deploy runbook will be documented in a later change.

The full stack (Postgres 16, one-shot migrations, web, Caddy) runs with Docker Compose:

```bash
cp .env.example .env   # fill in POSTGRES_PASSWORD at least
docker compose up -d --build
```

Web starts only after migrations exit 0, and Postgres is bound to `127.0.0.1` only. Caddy serves plain HTTP on the server IP while `APP_DOMAIN=:80`.

Every merge to `main` runs CI, builds one image, pushes it to GHCR (tagged by commit SHA and `latest`) and deploys it over SSH using the `production` GitHub Environment; the server pulls the image and never builds. The deploy fails if `migrate` fails or `web` is unhealthy. To roll back, run the **Deploy** workflow manually from GitHub with a commit SHA (empty means latest). One-time server hardening (deploy user, `ufw` on 22/80/443, SSH lockdown) is scripted in `scripts/harden-server.sh`; reach Postgres through an SSH tunnel.

## First admin and seed data

`npm run db:seed` writes only what the environment allows:

| Mode                                  | Reference data (tariffs) | First admin      | Demo users, subscriptions, requests      |
| ------------------------------------- | ------------------------ | ---------------- | ---------------------------------------- |
| Development, local database (default) | yes                      | if `ADMIN_*` set | yes                                      |
| Development with `--reference-only`   | yes                      | if `ADMIN_*` set | no                                       |
| `NODE_ENV=production`                 | yes                      | if `ADMIN_*` set | **never** (`--demo` exits with an error) |

On a fresh server, after migrations have run, create the first admin and tariffs from a machine that can reach Postgres (open the SSH tunnel first, since Postgres is bound to `127.0.0.1`):

```bash
NODE_ENV=production \
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB \
ADMIN_NAME="Име Фамилия" ADMIN_EMAIL=owner@example.com \
ADMIN_PHONE=0888000000 ADMIN_PASSWORD='at-least-12-characters' \
npm run db:seed
```

The run is safe to repeat: tariffs are upserted by category, and the admin is created only when no admin exists yet (an existing admin is never changed). Sign in at `/login`, then approve specialists at `/admin/specialists`.

Specialists sign up as **Pending** and see the pending-approval screen. An admin's approve/reject applies on their very next request, with no re-login, because role and status are read from the database each time.
