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
| `npm run test:e2e`   | Run desktop and mobile Chromium user flows         |

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
