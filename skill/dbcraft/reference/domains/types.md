# Domain: Types

Types are the schema's vocabulary. A type decision made once protects every future query and
consumer; a sloppy type taxes them all forever.

## The decisions that matter

**Money — never floating point.**
- `NUMERIC(p,s)` / `DECIMAL(p,s)`: e.g. `NUMERIC(12,2)` for prices, or integer minor units
  (`amount_cents BIGINT`) for high-volume or multi-currency systems.
- FLOAT/DOUBLE/REAL cannot represent 0.10 exactly; sums drift. Banned for anything money-adjacent.

**Time — always with a zone (or a written policy).**
- PostgreSQL: `timestamptz` (preferred). MySQL: `TIMESTAMP` (UTC-normalized) or `DATETIME` + a
  documented UTC policy. SQLite: TEXT in ISO-8601 UTC.
- Store UTC; convert at the edge. Never store local wall time without the offset.
- Dates-only (`DATE`) are fine when there is genuinely no time component (birthday, holiday).

**Text — deliberate sizes.**
- `VARCHAR(n)` when the length is a domain fact (an ISO code is 2–3 chars; a slug maybe 200).
- `TEXT` for genuinely unbounded content. `VARCHAR(255)` for everything is a habit, not a decision.
- Never store structured data in text columns (CSV in a string, JSON in TEXT without the JSON type).

**IDs — one strategy per table family** (`domains/keys.md`):
- `BIGINT IDENTITY` (fast, compact, sortable) or `UUID` (distributed, unguessable) or ULID (both,
  sortable + unguessable). Never expose auto-increment counts where that leaks business volume;
  never use mutable natural keys as FKs.

**Booleans vs enums:**
- Real booleans for real two-state facts (`is_verified`).
- Lifecycles are not booleans: `status` + CHECK/enum (`active / suspended / pending_deletion`), not
  `is_active` + `is_suspended` + `is_pending_deletion` (`anti-patterns.md` T5).

**JSON columns — the narrow case:**
- JSONB (Postgres) for payloads whose shape genuinely varies per row *and* is not queried
  structurally (event payloads, audit blobs, external webhook bodies).
- If you filter, join, or index on a field inside the JSON — it's a column, not JSON
  (`anti-patterns.md` M3).

**Enumerated values:**
- PostgreSQL native enums for truly fixed vocabularies; CHECK constraints when the vocabulary may
  grow (adding a CHECK is a cheaper migration than extending an enum type); lookup tables when the
  vocabulary carries its own attributes (codes with descriptions, translations).

**Numbers:**
- `INTEGER`/`BIGINT` for counts and quantities (exact), NUMERIC for fractional-exact, floats only
  for genuinely continuous measurements (sensor readings, statistics) — and never for money.

## The habit to kill

`VARCHAR(255)` is the default-answer tell: it appears when nobody asked "how long can this actually
be, and what does that length mean?" Ask that question for every column; the answer becomes the type.

## Bans (recap)

Float money, tz-less timestamps, VARCHAR(255) reflex, JSON-as-schema, booleans for lifecycles,
stringly enums, mutable natural keys as FKs.
