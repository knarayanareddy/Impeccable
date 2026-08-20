# Command: measure

The quantitative pass. Numbers, not adjectives. Complements `review` (judgment) and `audit`
(defects). No edits.

## What gets measured

1. **Nullability** — nullable columns per table; % of columns nullable; columns whose null meaning
   is undocumented.
2. **Keys & constraints** — tables without a PK; FK columns without indexes; FKs without explicit
   ON DELETE; UNIQUE constraints vs real-world uniqueness facts; CHECK count per table.
3. **Types** — float columns on money-adjacent names; tz-less timestamps; `VARCHAR(255)` count;
   stringly status columns without CHECK; boolean columns per table (flag sprawl).
4. **Modeling** — JSON/JSONB column density; EAV-shaped tables (entity/attribute/value column
   trios); polymorphic `*_type`/`*_id` pairs.
5. **Indexes** — total indexes; indexes per table; estimated-unused (no matching query pattern in
   the hot-query list); composite order issues.
6. **Migrations** — count; reversible count (%); destructive operations in history; migration age
   distribution (recent churn).
7. **Queries** — `SELECT *` occurrences in app code; interpolated-SQL occurrences; WHERE-less
   mutations; OFFSET pagination sites; N+1 sites found by inspection.

## Output

A measurement report: per-metric table with numbers, the floor comparison against `schema-floor.md`,
then the ranked delta list — cheapest change to highest data-integrity impact.

## Rules

- Every number cites its method (checker / schema dump / inspection). If a metric can't be measured
  with available tooling, report "not measured" — never guess.
- Quote before/after numbers around any subsequent refactor pass — that's how schema craft becomes
  visible.
