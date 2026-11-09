# DOMORA deploy runbook

How the private beta is hosted, deployed, rolled back, bootstrapped and backed up, and what must be true before anyone outside the team is invited.

- [Topology](#topology)
- [First-time server setup](#first-time-server-setup)
- [Deploy](#deploy)
- [Rollback](#rollback)
- [SSH tunnel to Postgres](#ssh-tunnel-to-postgres)
- [First admin and seed](#first-admin-and-seed)
- [Hard gates before inviting external users](#hard-gates-before-inviting-external-users)
- [Backups and restore](#backups-and-restore)

Commands marked **server** run on the VPS as the `deploy` user in `/opt/domora-app`. Commands marked **local** run on your own machine. `SERVER` stands for the server IP or hostname.

## Topology

One VPS runs Docker Compose (`compose.yaml`):

| Service   | Role                                                                                      |
| --------- | ----------------------------------------------------------------------------------------- |
| `db`      | Postgres 16. Published on `127.0.0.1:5432` only. Data in the `pgdata` volume.             |
| `migrate` | One-shot. Applies migrations; must exit 0 before `web` and `worker` start.                |
| `web`     | Next.js server. Client and report photos in the `photos` volume (`/data/photos`).         |
| `worker`  | Delivers outbox notifications and removes orphan uploads older than 24 h.                 |
| `caddy`   | Public edge on 80/443. Reverse proxy to `web`; rejects request bodies larger than 16 MiB. |

`web`, `migrate` and `worker` share one image, built in CI and pulled from GHCR. The server never builds.

Until the [hard gates](#hard-gates-before-inviting-external-users) are met the beta runs as plain HTTP on the server IP, with the `console` notifier (emails are logged by `worker`, not sent), for the owner only.

## First-time server setup

1. **Server (root)**: install Docker Engine with the Compose plugin (Debian/Ubuntu).
2. **Local**: create a deploy-only SSH key pair: `ssh-keygen -t ed25519 -f domora-deploy -C domora-deploy`.
3. **Server (root)**: copy `scripts/harden-server.sh` over and run it with the deploy public key:

   ```bash
   sudo ./harden-server.sh "$(cat domora-deploy.pub)"
   ```

   It creates the non-root `deploy` user (docker group, authorised only by that key), enables `ufw` allowing only 22/80/443, disables root and password SSH logins, and creates `/opt/domora-app`. Before closing the root session, confirm from a second terminal that `ssh deploy@SERVER` works.

4. **Server (root)**: add your personal public key to `/home/deploy/.ssh/authorized_keys` as well. It is used for the Postgres tunnel and manual operations; the deploy key stays in GitHub only.
5. **Server**: clone the repository into the app directory. The deploy only uses `compose.yaml` and `caddy/Caddyfile` from it.

   ```bash
   git clone https://github.com/AlexzanderF/domora-app.git /opt/domora-app
   ```

6. **GitHub**: in the `production` Environment set the secrets below.

| Secret                         | Required | Value                                                                       |
| ------------------------------ | -------- | --------------------------------------------------------------------------- |
| `CONTABO_HOST`                 | yes      | Server IP or hostname                                                       |
| `CONTABO_USER`                 | yes      | `deploy`                                                                    |
| `CONTABO_SSH_KEY`              | yes      | Private half of the deploy key                                              |
| `CONTABO_PORT`                 | no       | SSH port, default `22`                                                      |
| `POSTGRES_PASSWORD`            | yes      | URL-safe characters only (letters, digits, `- _ . ~`)                       |
| `POSTGRES_USER`, `POSTGRES_DB` | no       | Defaults `domora_user`, `domora`                                            |
| `APP_DOMAIN`                   | no       | Empty means plain HTTP on the server IP. Set to the domain at gate 1        |
| `COOKIE_SECURE`                | no       | Empty means detect from the proxy. Set to `true` at gate 1                  |
| `NOTIFIER_DRIVER`              | no       | Empty means `console`. Set to `resend` at gate 3                            |
| `RESEND_API_KEY`               | gate 3   | Resend API key (EU region)                                                  |
| `NOTIFIER_FROM`                | gate 3   | Sender on the verified domain, e.g. `DOMORA <no-reply@your-domain.example>` |

GitHub Secrets are the source of truth: every deploy rewrites `/opt/domora-app/.env` from them. Do not edit `.env` on the server; the next deploy overwrites it. Do not change `POSTGRES_PASSWORD` after the first deploy: the database keeps the password it was initialised with.

## Deploy

Every merge to `main` runs the **Deploy** workflow: CI (`npm run check`, DB-backed tests, build) → build one image and push it to GHCR tagged with the commit SHA and `latest` → deploy over SSH. There is no staging.

On the server the deploy checks out the same commit (for `compose.yaml` and the Caddyfile), rewrites `.env`, pulls the image and runs `docker compose up -d --no-build --wait`. It **fails** if `migrate` exits non-zero or `web` does not become healthy (`/api/health`); the workflow log then shows `docker compose ps -a` and the last `migrate` and `web` log lines. A failed migration stops the rollout before `web` and `worker` are replaced.

Check a deploy on the **server**:

```bash
docker compose ps
```

```bash
docker compose logs --tail 100 web worker
```

Migrations must be additive (expand first, contract in a later release), so the previous image keeps working against the new schema.

## Rollback

1. In GitHub open **Actions → Deploy → Run workflow**.
2. Enter the full 40-character commit SHA of the release to return to (it must have been built by an earlier merge to `main`). Leave it empty to redeploy `latest`.
3. Run it. No CI and no build run; the existing image for that SHA is pulled and started, with the same health checks.

Rollback does not undo migrations. Because migrations are additive, the older image runs against the newer schema. If a migration itself is the problem, fix it forward with a new migration, or [restore from backup](#restore).

The next merge to `main` deploys the newest commit again, so revert the bad change on `main` before merging anything else.

## SSH tunnel to Postgres

Postgres is never public: it listens on the server's loopback only and the firewall allows just 22/80/443. Open a tunnel from your machine (**local**) and leave it running:

```bash
ssh -N -L 5432:127.0.0.1:5432 deploy@SERVER
```

The database is then at `postgresql://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/POSTGRES_DB`. If a local Postgres already uses 5432, forward another port (`-L 5433:127.0.0.1:5432`) and use that port in the URL.

## First admin and seed

On a fresh server, after the first successful deploy (migrations have run), create the tariffs and the first admin from a checkout of the repository on your machine (**local**, `npm ci` done, tunnel open):

```bash
NODE_ENV=production \
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB \
ADMIN_NAME="Име Фамилия" ADMIN_EMAIL=owner@example.com \
ADMIN_PHONE=0888000000 ADMIN_PASSWORD='at-least-12-characters' \
npm run db:seed
```

- With `NODE_ENV=production` the seed writes **only** reference data (tariffs) and the first admin. Demo users, subscriptions and requests are never written, and `--demo` exits with an error.
- All four `ADMIN_*` variables are required together; the password must be at least 12 characters.
- It is safe to repeat: tariffs are upserted by category, and the admin is created only when no admin exists yet. An existing admin is never changed.
- Do not leave `ADMIN_PASSWORD` in your shell history or environment afterwards.

Then sign in at `/login` and check `/admin/tariffs`.

**Onboarding users.** Clients sign up at `/signup` and are active at once. Specialists sign up as **Pending** and see the pending-approval screen; an admin approves or rejects them at `/admin/specialists`. The decision applies on the specialist's very next request, with no re-login. Further admins are not created by the seed once one exists.

## Hard gates before inviting external users

**Do not invite any external client, specialist or administrator until all four gates are met.** Until then the only user is the owner. Each gate is met only when its "Verify" checks pass on production.

### Gate 1: domain, TLS, secure cookies, HSTS, www redirect

1. Point DNS `A` records for the domain **and** `www.` at the server IP.
2. Commit this `caddy/Caddyfile` change (replace `your-domain.example`) and merge it:

   ```caddyfile
   {$APP_DOMAIN::80} {
       header Strict-Transport-Security "max-age=31536000"
       request_body {
           max_size 16MiB
       }
       reverse_proxy web:3000
   }

   www.your-domain.example {
       redir https://your-domain.example{uri} permanent
   }
   ```

3. Set the secrets `APP_DOMAIN=your-domain.example` (no scheme, no `www`) and `COOKIE_SECURE=true`, then redeploy (merge, or run the Deploy workflow manually). Caddy obtains and renews certificates itself and redirects HTTP to HTTPS.

Verify (**local**):

```bash
curl -sI https://your-domain.example | grep -i strict-transport-security
```

```bash
curl -sI http://your-domain.example | grep -i '^location: https://'
```

```bash
curl -sI https://www.your-domain.example | grep -i '^location: https://your-domain.example'
```

Each must print a line. Then sign in in a browser and confirm the `domora_session` cookie is marked `Secure`.

### Gate 2: off-box backups with a restore drill

- A Postgres dump **and** an archive of the photo volume are taken at least daily, automatically, and stored **off the VPS** (see [Backups and restore](#backups-and-restore)). Provider snapshots of the same VPS do not count.
- The [restore drill](#restore-drill) has been performed once from those off-box copies, and its date recorded.

Verify: the newest off-box dump and photo archive are less than 24 hours old, and the drill succeeded.

### Gate 3: verified sending domain before `resend`

1. In Resend (EU region) add the sending domain and publish its SPF and DKIM DNS records. Wait until Resend shows the domain as **verified**.
2. Only then set the secrets `NOTIFIER_DRIVER=resend`, `RESEND_API_KEY` and `NOTIFIER_FROM` (a sender on that domain) and redeploy.

Never set `NOTIFIER_DRIVER=resend` before the domain is verified. With `resend` and a missing key or sender, `worker` fails at startup and sends nothing; check `docker compose logs worker`.

Verify: trigger a real notification (for example approve a test specialist), confirm the email arrives, and confirm `/admin/notifications` lists no new FAILED deliveries.

### Gate 4: requests and authorization change shipped

The guarded request lifecycle (start work, rate, raise issue and resolve issue all enforce the actor through `can()`) must be running in production. It was merged with issues #112 and #113.

Verify: the commit deployed to production is at or after those merges. On the **server**:

```bash
grep DOMORA_IMAGE .env
```

The tag is the deployed commit SHA; confirm it is on `main` and not a rollback to a commit before those merges.

## Backups and restore

Two things hold all state: the `pgdata` volume (Postgres) and the `photos` volume. Back up both, together.

### Take a backup

Run from a machine that is **not** the VPS (**local**, or a second host on a daily schedule), so the copies land off-box directly:

```bash
ssh deploy@SERVER 'cd /opt/domora-app && docker compose exec -T db sh -c "pg_dump -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -Fc"' > "domora-db-$(date +%F).dump"
```

```bash
ssh deploy@SERVER 'cd /opt/domora-app && docker compose exec -T web tar -C /data/photos -czf - .' > "domora-photos-$(date +%F).tgz"
```

Keep at least 14 daily copies. Schedule both commands (cron or similar) on that machine and alert on a non-zero exit or an empty file. The files contain personal data: store them encrypted and access-controlled.

### Restore drill

Proves the off-box copies are usable, without touching production. Run on any machine with Docker (**local**):

```bash
docker run -d --rm --name domora-restore-drill -e POSTGRES_PASSWORD=drill postgres:16-alpine
```

```bash
docker exec -i domora-restore-drill pg_restore -U postgres -d postgres --no-owner < domora-db-YYYY-MM-DD.dump
```

```bash
docker exec domora-restore-drill psql -U postgres -c "select (select count(*) from users) as users, (select count(*) from requests) as requests, (select count(*) from request_photos) as photos"
```

```bash
tar -tzf domora-photos-YYYY-MM-DD.tgz | grep -c '[^/]$'
```

```bash
docker stop domora-restore-drill
```

Pass criteria: `pg_restore` reports no errors, the counts are plausible for production, and the archive lists at least as many files as the `photos` count (orphan uploads younger than 24 h may add a few).

### Restore

Replaces production data with a backup. Everything written after that backup is lost.

1. **Server**: stop incoming traffic and the worker. `web` and `db` stay up.

   ```bash
   docker compose stop caddy worker
   ```

2. **Server**: empty the database, including the migration history, so nothing newer than the backup is left behind.

   ```bash
   docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA IF EXISTS drizzle CASCADE" -c "DROP SCHEMA public CASCADE" -c "CREATE SCHEMA public"'
   ```

3. **Local**: load the dump.

   ```bash
   ssh deploy@SERVER 'cd /opt/domora-app && docker compose exec -T db sh -c "pg_restore -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" --no-owner"' < domora-db-YYYY-MM-DD.dump
   ```

4. **Local**: restore the photos from the archive taken with that dump.

   ```bash
   ssh deploy@SERVER 'cd /opt/domora-app && docker compose exec -T web tar -C /data/photos -xzf -' < domora-photos-YYYY-MM-DD.tgz
   ```

5. **Server**: start everything again and check health.

   ```bash
   docker compose up -d --no-build --wait
   ```

If the dump is older than the running image's schema, `migrate` applies the missing migrations in step 5. Photo files newer than the backup stay on disk unreferenced; the worker's orphan sweep removes them after 24 hours.

Never run `docker compose down -v` on the server: it deletes the database and every photo.
