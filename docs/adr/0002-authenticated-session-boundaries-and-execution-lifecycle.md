# 2. Authenticated Session Boundaries and Execution Lifecycle

Public marketing pages (`/`) and authentication routes (`/login`, `/signup`, `/forgot-password`) are strictly for unauthenticated visitors. To provide a focused workspace experience, any authenticated session attempting to load public landing or authentication routes is redirected to their designated role dashboard: Clients to `/client`, Specialists to `/specialist` (or `/pending-approval` if awaiting verification), and Administrators to `/admin`.

Additionally, the specialist on-site execution lifecycle is simplified to a 2-step model: `[Започни работа]` (starts job execution) followed by `[Завърши с доклад]` (submits a mandatory work description report and requests client sign-off). This eliminates extraneous micro-states while ensuring that every job has a recorded completion report before moving to client confirmation and billing.
