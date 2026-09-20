# Working on DOMORA

1. Update `main`, then create a short-lived feature branch, for example `feature/booking-history`.
2. Run `npm ci` using Node.js 24. The lockfile is the shared dependency source of truth.
3. Keep routes in `src/app`, shared UI in `src/components`, and business logic with its feature in `src/features`.
4. Use Server Components by default. Add `"use client"` at interactive boundaries. Do not move secrets or privileged operations into browser components.
5. Keep Bulgarian UI copy, responsive layout and keyboard access consistent with the existing app.
6. Run `npm run format`, `npm run check`, and `npm run build`. Do not write new tests unless explicitly requested.
7. Open a pull request with the problem, changed behavior, screenshots for UI changes, and relevant validation. Ask your teammate to review before merging.

Agree on feature ownership before editing shared state or global CSS. Keep pull requests focused so reviews stay manageable. Do not hand-edit generated files in `dist/` or `.next/`.

The CI workflow is included in the repository. A repository administrator can enable branch protection requiring the `quality` job and a teammate's review before merging; those GitHub settings are not configured by this migration.
