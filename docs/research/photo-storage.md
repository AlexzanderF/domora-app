# Photo uploads: storage and limits (research for #103, map #98)

Question: where do request photos live (local volume vs S3-compatible storage), upload flow, size/type limits, retention and cost, for a single-server Docker + Caddy private beta in Bulgaria.

## Recommendation (short)

1. **Beta: store photos on a local Docker named volume**, written by the Next.js server, behind a small `PhotoStore` interface (put / get stream / delete) so an S3 driver can replace it later without touching callers. The map already wants "side effects behind an interface".
2. **Upload via the server** (multipart POST to a Route Handler), not signed upload. With one server and at most 5 photos per request there is no bandwidth win from signed upload, and the server must validate the bytes anyway.
3. **Serve photos only through an authenticated Route Handler**, never from `public/` (home interiors are personal data).
4. **Back up the volume off-box** (it shares the single point of failure with Postgres). Cheapest offsite target: Hetzner Object Storage (EUR 6.49/month incl. 1 TB) or Backblaze B2.
5. **Move to S3-compatible storage when** a second app instance appears, the volume grows past tens of GB, or photos should be served from a CDN. First choice then: Hetzner Object Storage (EU locations, presigned URLs, automatic expiry). Do not choose self-hosted MinIO (see below).

## Current code (repo facts)

- `src/features/bookings/photo-picker.tsx`: `<input type=file accept="image/*" multiple>`, max 5 files, `file.type.startsWith("image/")`, <= 10 MB each, previews via `URL.createObjectURL` + `next/image unoptimized`. The hint says "only local preview": nothing is uploaded or persisted today.
- `docker-compose.prod.yml`: services `app`, `db` (volume `pgdata`), `caddy` (volumes `caddy_data`, `caddy_config`). No volume for uploads.
- `Caddyfile`: bare `reverse_proxy app:3000`, no body limit.
- `Dockerfile`: `npm start` (not standalone output), runs as non-root `nextjs` (uid 1001), so a mounted upload volume must be writable by uid 1001.
- `next.config.ts`: no `serverActions.bodySizeLimit` set.

## Local volume vs S3-compatible storage

| | Local Docker volume | S3-compatible (Hetzner / R2 / B2) |
|---|---|---|
| Ops complexity | volume mount + backup | credentials, bucket, SDK, CORS if browser-direct |
| Cost (beta, <10 GB) | included in server disk | about EUR 0 to 6.5/month |
| Durability | one disk; lost with the host unless backed up | provider-managed redundancy |
| Scale-out | blocked (a second instance cannot see files) | works |
| Serving | via app (auth check) | presigned GET or via app proxy |
| Retention | worker job deletes files | native lifecycle/expiry rules |
| Portability | tied to server | provider-swappable via S3 API |

### Prices (fetched 2026-11-08; re-verify before buying)

- Cloudflare R2 Standard: $0.015/GB-month, Class A $4.50/M, Class B $0.36/M, free tier 10 GB-month + 1M A + 10M B, egress free. Source: https://developers.cloudflare.com/r2/pricing/
- Backblaze B2: from $6.95/TB/month, first 10 GB free, egress free up to 3x stored data then $0.01/GB, Class A/B/C calls free. Source: https://www.backblaze.com/cloud-storage/pricing
- Hetzner Object Storage: EUR 6.49/month base incl. 1 TB storage + 1 TB egress (excl. VAT), overage EUR 1.00/TB egress, S3 ops and ingress free, objects <64 KB billed as 64 KB, locations Falkenstein/Nuremberg/Helsinki. Sources: https://www.hetzner.com/storage/object-storage/ and https://docs.hetzner.com/storage/object-storage/overview
- MinIO self-hosted: the community repository was archived on 2026-04-25 ("no longer maintained"), AGPLv3. Source: https://github.com/minio/minio . Do not adopt for a new system.

Beta sizing example: 200 requests x 3 photos x 2 MB (after downscaling) = 1.2 GB. R2 and B2 would be effectively free at this size; Hetzner has a fixed EUR 6.49 floor. Cost is not the deciding factor; operational simplicity is.

### EU / GDPR notes

- R2 location hints are best-effort; only the `eu` jurisdiction (endpoint `<ACCOUNT_ID>.eu.r2.cloudflarestorage.com`, fixed at bucket creation) guarantees location. Source: https://developers.cloudflare.com/r2/reference/data-location/
- B2 EU region availability was not confirmed from the sources fetched (unverified).
- Hetzner locations are all in the EU (Germany, Finland). Source above.
- Photos of a client's home can reveal address, family and valuables; treat as personal data. Retention period and any DPA with a storage provider are legal decisions, tied to the map's GDPR item.

## Upload flow

### Option A: via the server (recommended)

Browser POSTs `multipart/form-data` to a Route Handler; the handler checks session and authorization, validates, writes through `PhotoStore`, and returns photo ids that request creation then references.

- Pros: one validation point; no CORS; identical for volume and S3; size enforced by Caddy plus handler.
- Cons: bytes pass through Node (fine at beta scale).

### Option B: signed upload direct to the bucket

- Presigned PUT cannot enforce a size range; only presigned POST with a `content-length-range` condition can. Source: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html
- R2 presigned URLs support GET/HEAD/PUT/DELETE but not POST, and not on custom domains. Source: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- B2 lists browser-based POST uploads to presigned URLs as unsupported. Source: https://www.backblaze.com/docs/cloud-storage-s3-compatible-api
- Hetzner advertises pre-signed URLs; its supported-actions page does not confirm POST policy or CORS (unverified). Source: https://docs.hetzner.com/storage/object-storage/supported-actions
- So on R2/B2 a size limit cannot be enforced at upload time; you would need post-hoc checks and deletion, plus CORS and a confirm step. Not worth it for the beta.

### Server Action or Route Handler (Next.js 16.3.5 docs in `node_modules/next/dist/docs/`)

- Server Action request bodies are capped at **1 MB by default**; raise with `serverActions.bodySizeLimit`. Sources: `01-app/02-guides/server-actions.md`, `01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`.
- `experimental.proxyClientMaxBodySize` (default **10 MB**) applies only when a `proxy` file exists, because Next buffers the body to clone it; larger bodies are truncated with a logged warning. Source: `01-app/03-api-reference/05-config/01-next-config-js/proxyClientMaxBodySize.md`.
- `bodySizeLimit` is global for all actions, so prefer a dedicated Route Handler for uploads. The docs I read describe no separate documented cap for Route Handlers, so the effective limit there is Caddy plus your own check (not verified further).
- The self-hosting guide recommends a reverse proxy for "payload size limits" and rate limiting. Source: `01-app/02-guides/self-hosting.md`.
- `next/image` optimization fetches would not carry the user cookie, so show stored photos with `unoptimized` or pre-generated thumbnails served from the authenticated route.

## Limits and validation (proposal)

- Max 5 photos per request (matches the current UI).
- **Client-side downscale** to about 1600 px long edge (JPEG/WebP) before upload; phone photos are 3-8 MB. Hard server cap **5 MB per file, 15 MB per request**.
- Caddy: `request_body { max_size 16MB }` on the upload path via a matcher; Caddy answers 413 and rejects early on Content-Length. Source: https://caddyserver.com/docs/caddyfile/directives/request_body
- Allow-list jpeg, png, webp (decide on HEIC from iPhones: convert client-side or server-side). Do not trust `file.type` or extension: sniff magic bytes server-side and re-encode (for example with `sharp`), which also strips EXIF/GPS and defuses polyglot files.
- Store under random UUID names outside `public/`; keep the original filename only as DB metadata.
- Serve with the validated `Content-Type`, `X-Content-Type-Options: nosniff`, `Cache-Control: private`.
- Rate-limit uploads per user in the app (Caddy has no built-in limiter).

## Retention (proposal, needs legal confirmation)

- Keep photos while the request is active plus a dispute window (for example 90 days after completion or cancellation); ADR 0003 has a dispute workflow, so photos may be evidence.
- Delete photos on account erasure (GDPR).
- Volume: a worker job (the map plans a worker process) deletes expired files and orphans (uploaded but never attached, for example older than 24 h). S3: native lifecycle expiry covers this; Hetzner advertises automatic object expiry.

## Deployment changes for the eventual ticket (not done here)

- Named volume `uploads` mounted at e.g. `/data/uploads` in `app`, owned by uid 1001.
- `request_body` limit in the Caddyfile.
- `uploads` included in offsite backup together with `pgdata`.
- Env `UPLOAD_DIR`; later `S3_*` for an alternative driver.

## Open questions

- HEIC handling.
- Final retention period and storage-provider DPA (legal).
- Whether specialists upload completion photos (changes volume and limits).
- B2 EU region and Hetzner POST-policy/CORS behaviour: unverified, matter only for direct browser uploads.
