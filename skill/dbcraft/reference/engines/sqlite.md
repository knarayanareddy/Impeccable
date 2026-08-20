# Engine sheet: SQLite

Loaded with the relevant domains when the engine is SQLite. The native-accent specifics; the
compass domains still hold — SQLite's looseness makes the *discipline* the product.

## The type-affinity reality

- SQLite has **type affinity, not types**: a column declared `INTEGER` can hold text. The
  contract is enforced by CHECKs, not declarations (`domains/constraints.md`'s "the schema says
  what is true", at maximum strictness):
  `CHECK (typeof(col) = 'integer')` where the type truly matters.
- Dates are TEXT in ISO-8601 UTC (`strftime('%Y-%m-%dT%H:%M:%fZ')`) — string-comparable,
  sortable, tz-explicit (`domains/types.md`).
- Money as integer minor units (`amount_cents INTEGER`) or TEXT decimals with CHECKs — never
  REAL (`domains/types.md`'s float ban applies double here).

## Integrity switches (on by default or nothing works)

- `PRAGMA foreign_keys = ON` per connection — **FKs are off by default**; a schema with FKs and
  no pragma is a schema without FKs (`domains/constraints.md`).
- `PRAGMA journal_mode = WAL` for concurrent readers; `PRAGMA busy_timeout` for writer
  contention — the single-writer reality is designed for, not discovered
  (`domains/concurrency`-adjacent).
- `STRICT` tables (3.37+) where the engine version allows — the affinity looseness, reined in.

## Migrations (the rebuild reality)

- `ALTER TABLE` cannot change column types in the general case: the pattern is
  **create-new-table → copy → drop-old → rename** (the 12-step dance) — expand/contract by
  construction (`domains/migrations.md`'s protocol, in its most literal form).
- Migration tooling (user_version pragma or a framework) is versioned and reversible — the
  `down` is tested, same as any engine.

## Operations

- `EXPLAIN QUERY PLAN` for the plan; `ANALYZE` for statistics; partial indexes exist
  (`CREATE UNIQUE INDEX … WHERE deleted_at IS NULL`) — the soft-delete uniqueness fix works
  here too (`domains/indexes.md`).
- Single-file deployment: the schema file IS the artifact; version it, never hand-edit
  production copies.

## Bans

REAL money, tz-less date strings, FKs without the pragma, untyped-affinity contracts without
CHECKs, hand-edited production files, migration scripts without tested downs.
