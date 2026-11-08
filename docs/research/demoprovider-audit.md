# Audit: DemoProvider usage and data-model gaps

Resolves #100 (parent map #98). Research only; no application code changed. All claims cite files in this repo at commit `2994965`.

## Summary

- `DemoProvider` (`src/features/requests/demo-provider.tsx`, mounted in `src/app/providers.tsx`) holds in-memory `requests`, `tariffs`, `subscription` and the `booking` dialog state. It is seeded from `demo-data.ts`.
- 16 files call `useDemo()` (excluding the provider itself). Most are a **hybrid**: the page (server component) passes `initial*` props from Postgres, and the component falls back to demo state when the prop is `null`/`undefined`. Only `plans-configurator.tsx` is genuinely demo-only for writes.
- `requests` already has columns for completion report, rating, issue flag, issue note, recommendation and admin dispatch (ADR 0005). The gaps are mostly **missing behavior around existing columns**; the real schema gaps are photos, timestamps/history for disputes, ratings and recommendations, and indexes.

## 1. Who uses `useDemo()`

Source: `grep useDemo src`; each file read. "DB path" = the component reads server data when provided and calls a server action.

| File | Uses from demo | DB path | Classification |
|---|---|---|---|
| `features/client-dashboard/client-dashboard.tsx` | `requests`, `subscription`, `updateRequest`, `openBooking` | `initialRequests`/`initialSubscription` props; `transitionRequestServerAction` (optimistic local update first) | Hybrid |
| `features/specialist/daily-agenda.tsx` | `requests`, `updateRequest` | `initialAgenda`; `startWorkAction`, `completeWorkAction` | Hybrid |
| `features/specialist/opportunity-feed.tsx` | `requests`, `updateRequest` | `initialOpportunities`; `assignSpecialistAction` | Hybrid |
| `features/specialist/dashboard-summary.tsx` | `requests` | `initialRequests` | Hybrid (read-only) |
| `features/requests/request-list.tsx` | `requests` | `initialRequests` | Hybrid (read-only) |
| `features/requests/request-actions.tsx` | `updateRequest` | `transitionRequestServerAction` | Hybrid |
| `features/workspace/tariff-form.tsx` | `tariffs`, `updateTariffs` | `initialTariffs`; `updateTariffsAction` | Hybrid |
| `features/workspace/workspace-stats.tsx` | `requests` | `initialStats` | Hybrid (read-only) |
| `features/admin/admin-kpi-cards.tsx` | `requests` | `initialMetrics` (`pendingSpecialistsCount` falls back to hard-coded `1`) | Hybrid (read-only) |
| `features/bookings/booking-dialog.tsx` | `booking`, `closeBooking`, `tariffs`, `addRequest` | `createServiceRequestAction`, then also calls `addRequest` | Hybrid; **quote uses demo tariffs, never DB tariffs** |
| `features/plans/plans-configurator.tsx` | `tariffs`, `addRequest` | none | **Demo-only**: creates a fake `generateDemoId()` request in memory, no server action. Rendered on public `(marketing)/plans`. |
| `features/bookings/booking-button.tsx`, `booking-cta.tsx`, `booking/browser-tool.tsx`, `services/service-grid.tsx` | `openBooking` only | n/a | UI-state only (booking dialog open/close), not data |

Dead provider members in DB mode: `subscription`, `subscribePlan`, `cancelSubscription`, `setSubscription`. Only `client-dashboard.tsx` reads `demo.subscription`, and only when not in DB mode. The real flow (`client-plan-view.tsx`) uses `createSubscriptionAction`/`cancelSubscriptionAction` and does not touch the provider.

`transitions.ts` (`transitionRequest`) is the in-memory twin of the server transition logic; both share rules from `request-rules.ts`. `client-dashboard.tsx` also uses it to update server-backed local state optimistically.

## 2. Server actions that exist

- Auth: `features/auth/server/actions.ts` (login, registerClient, registerSpecialist, refresh, logout).
- Admin: `updateSpecialistStatusAction` (called from `auth/auth-provider.tsx`), `updateTariffsAction`; queries/metrics for KPIs, specialist applications, disputed and unassigned requests, all requests, tariffs.
- Client profile: `updateClientProfileAction`.
- Subscriptions: `createSubscriptionAction`, `cancelSubscriptionAction`, `findUserSubscription`.
- Requests (`features/requests/server/actions.ts`): `createServiceRequestAction`, `assignSpecialistAction`, `startWorkAction`, `completeWorkAction` (report required), `cancelRequestAction`, `transitionRequestServerAction` (advance/complete/cancel/decline/rate/issue/resolve), `adminAssignSpecialistAction`, `adminRecommendSpecialistAction`.
- Request and admin actions have `*.static.ts` twins and return `{success:true, mode:"demo"}` when `!isDbConfigured` or `NEXT_STATIC_EXPORT=1`. That demo-mode branch is why the demo fallbacks (and DemoProvider data) still exist; dropping the static `dist/` host (#98) removes the need.

Server-rendered pages passing DB data: `/admin`, `/admin/requests`, `/admin/specialists`, `/admin/tariffs`, `/client`, `/client/requests`, `/client/plan`, `/client/profile`, `/specialist`, `/specialist/opportunities`.

## 3. Data-model gaps (`src/db/schema.ts`, ADR 0003/0005, `CONTEXT.md`)

Current `requests` columns: `report` (text), `rating` (integer, CHECK 1..5), `issue` (bool), `issueNote` (text), `recommendedSpecialistId` (FK, set null), `dispatchedByAdmin` (bool), `cancelled` (bool). ADR 0005 says `rating` is `smallint`; the schema uses `integer` (doc drift, harmless).

### Ratings
- Exists: `requests.rating` with range CHECK; `rate` branch validates via `isValidRating`/`canRate`.
- Gaps: no rating comment; no `rated_at`; no specialist average (derivable by joining on `requests.specialistId`, but that column is unindexed). A column is enough for beta; a separate `ratings` table is only needed for reviews, edits or specialist replies.
- Authorization gap: the `rate` branch checks request state only, with no session or ownership check (not seen in the code read).

### Disputes
- Exists: `requests.issue`, `requests.issueNote`; the admin triage queue reads them; `resolve` clears both.
- Gaps:
  - **No action writes `issueNote`.** The `issue` action is `{type:"issue"}` with no text and sets only `issue=true`. `issueNote` is populated only by `db/seed.ts`; the admin queue falls back to `request.description`.
  - `resolve` erases flag and note: no dispute history, outcome, resolver or timestamps (`issue_opened_at`, `resolved_at`, `resolved_by`).
  - `issue`/`resolve` branches check request state only, no role/ownership (needs the shared authorization layer from #98).
  - For multiple disputes per request or a message thread: new `request_disputes` (id, request_id, opened_by, note, status, resolution, opened_at, resolved_at, resolved_by) and optionally `dispute_messages`. Minimal alternative: add `issue_opened_at` and keep the columns.

### Completion reports
- Exists: `requests.report`, mandatory for `IN_PROGRESS -> AWAITING_CONFIRMATION` in `completeWorkAction`.
- Gaps: no `report_submitted_at` / `completed_at` (only `updated_at`, which changes on any edit); no structured fields (hours, materials, final price); no attachments; report is overwritten, not versioned (fine if one report per request).

### Photos
- Exists: UI only. `bookings/photo-picker.tsx` creates local blob previews (up to 5 images, 10 MB each); its label says "само локален преглед". Nothing is uploaded or stored.
- Gaps: no table, no storage. Needs `request_photos` (id, request_id FK cascade, uploaded_by FK, kind `BOOKING|COMPLETION|DISPUTE`, storage_key, mime_type, size_bytes, created_at), a storage decision (local Docker volume behind Caddy vs S3-compatible), and an upload action/route. `createServiceRequestAction` and `completeWorkAction` accept no files.

### Admin recommendations
- Exists: `requests.recommendedSpecialistId` set by `adminRecommendSpecialistAction`, cleared on admin assign; `dispatchedByAdmin` marks forced assignment; used by `admin/unassigned-requests-queue.tsx`.
- Gaps: one recommended specialist per request, no history; no `recommended_by`/`recommended_at`; no way for the specialist to decline (persists until claimed); no notification (worker design in #98). A `request_recommendations` table (request_id, specialist_id, recommended_by, created_at, status) is only needed for multi-recommend or audit.
- Note: `specialist_profiles.category`/`area` are free text and `findSpecialistRequests` matches with ILIKE (comment at `db/seed.ts:184`), so opportunity matching is loose.

### Cross-cutting
- No indexes beyond PKs/uniques: add `requests(client_id)`, `requests(specialist_id)`, `requests(status)`, `requests(recommended_specialist_id)`, `sessions(user_id)`.
- No event history (`request_events`) for assign/start/complete/dispute/resolve, needed for audit or notification jobs.
- `subscriptions.user_id` is UNIQUE (one subscription row per user ever, so resubscribe must reuse the row); requests have no `subscription_id`, so `visitsRemaining` is never consumed by a request.
- `requests` has no scheduled date/time columns although the booking form collects date and time. Unverified: how `createServiceRequestAction` maps them; check before the spec.
- Booking quotes read demo tariffs, not `tariffs` rows, so admin tariff edits do not affect what clients see.

## 4. Suggested ordering for the spec (input to #98, not decisions)

1. Remove demo fallbacks: make `initial*` props required, delete `demo-data.ts`, the provider's data fields, the `*.static.ts` twins and `mode:"demo"` branches; keep only booking dialog open/close state in a small client context.
2. Convert `plans-configurator.tsx` to a real server action (the only demo-only writer) and feed booking quotes from DB tariffs.
3. Fix dispute capture (`issueNote` input, role/ownership checks on `rate`/`issue`/`resolve`).
4. Schema additions: timestamps (`report_submitted_at`, `completed_at`, `issue_opened_at`, `rated_at`), indexes, `request_photos`; defer `request_disputes`/`request_events`/`request_recommendations` unless the spec needs history.
