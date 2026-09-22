# 5. Service Request Flags as Columns

Service request lifecycle flags (`cancelled`, completion `report`, `rating`,
dispute `issue` + `issueNote`, `recommendedSpecialistId`, `dispatchedByAdmin`)
are stored as dedicated `requests` table columns instead of bracket-encoded
markers inside the `description` text column.

## Context

Flags were historically smuggled into `description` as `[ОТЧЕТ]`, `[СИГНАЛ]`,
`[ОЦЕНКА]`, `[ОТКАЗАНА]`, `[ПРЕПОРЪЧАНА]`, `[ДИСПЕЧЕР]` markers, re-parsed by
regex on every read and mirrored by SQL `LIKE` in admin queries. That split
the read/write contract across writers, parsers, SQL pre-filters, and views,
with no single owner and live dialect drift between them.

## Decision

- Six columns on `requests`; `rating` guarded by a `smallint` +
  `CHECK (rating BETWEEN 1 AND 5)` constraint (a score is ordinal numeric
  data, so an enum is the wrong type); `recommended_specialist_id` as a real
  foreign key with `ON DELETE SET NULL`.
- Lifecycle rules live once in `request-rules.ts`, shared by the in-memory
  transition seam and the database-backed server actions.
- `description` returns to pure client text. No backfill was needed: every
  existing row was mock seed data, so the database was wiped and reseeded.

## Consequences

- Flags are queryable with plain equality instead of pattern matching; no
  false positives from client-typed bracket text.
- Illegal states (out-of-range ratings, dangling recommendations) are
  unwritable below the application layer.
- Future flags must be columns, not markers.
