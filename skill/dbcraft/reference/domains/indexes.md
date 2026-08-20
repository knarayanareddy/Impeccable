# Domain: Indexes

Indexes are where schema design meets query reality. The rule: **indexes are designed from the query
patterns, not from the columns** — and every index must be able to name the query it serves.

## Design procedure

1. Collect the hot queries (from code, logs, or the ORM's query list) — the ones that run often or
   on big tables.
2. For each, derive the access path: which columns filter (equality), which order (sort), which
   select (covering).
3. Design the index per query, then **merge**: one composite index can serve several queries if the
   leading columns match. Prefer fewer, well-ordered indexes over many single-column ones.

## Composite index ordering

- **Equality columns first, then ranges, then sorts.** `INDEX (status, created_at)` serves
  `WHERE status = 'open' ORDER BY created_at` and `WHERE status = 'open' AND created_at > ?` — but
  not `WHERE created_at > ?` alone.
- The most selective equality column leads, within equality.
- `ORDER BY` columns go last; a sort that matches the index avoids a sort step entirely.

## Index types (pick deliberately)

| Type | For |
|---|---|
| B-tree (default) | Equality, ranges, sorts |
| Hash | Pure equality (rarely worth it over btree) |
| GIN | JSONB containment, arrays, full-text |
| GiST/SP-GiST | Geometric, some text cases |
| BRIN | Huge append-only tables correlated with physical order (time-series) |
| Partial | Indexing a slice: `WHERE status = 'open'` or `WHERE deleted_at IS NULL` |
| Covering (INCLUDE) | Index-only scans — add the selected columns to avoid heap lookups |
| Functional | `lower(email)`, `date(created_at)` |

## The rules

- **Every FK gets an index** — the cascade, the join, and the orphan scan all need it
  (`schema-floor.md` #3). This is the most-omitted index in real schemas.
- **Every hot query must be index-backed** — verify with the plan (`EXPLAIN ANALYZE`), not with
  hope. "The planner will figure it out" is how sequential scans happen.
- **Drop the unused.** Indexes cost every write. Audit periodically (`pg_stat_user_indexes` and
  friends); an index no query uses is furniture — remove it.
- **Index maintenance is part of ownership:** bloat, duplicates (`(a)` + `(a, b)` — the former is
  usually redundant), and unused indexes are reviewed, not accumulated.
- **Respect the tradeoffs:** each index adds write amplification. On write-heavy tables, index the
  minimum that serves the measured read patterns — and say which queries justify each one.

## Partitioning (when scale demands it)

- Partition when a table's size makes maintenance (VACUUM, index rebuilds) or retention the
  bottleneck — *measured*, not guessed. Time-series and event tables are the usual candidates.
- Partition by the key the queries filter on (time for retention, tenant for isolation); indexes
  stay local to partitions, so the pruning plan (`EXPLAIN`) must show only the needed partitions
  scanned.
- Partitioning changes the constraint story: PKs must include the partition key; unique
  constraints without it need the partition column added or become per-partition (a known,
  documented tradeoff — it is how the "unique email" guarantee quietly loosens).
- Rule of thumb: a table under ~50M rows is usually fine unpartitioned with good indexes —
  partitioning is the answer to maintenance pain, not to "big".

## Soft deletes and uniqueness

`deleted_at` + `UNIQUE(email)` breaks the moment a deleted user re-registers. The fix is a partial
index: `CREATE UNIQUE INDEX ... ON users (lower(email)) WHERE deleted_at IS NULL` (or the tombstone
design). Every soft-delete schema needs this thought applied to *each* unique constraint.

## Bans (recap)

Unindexed FKs, index-per-column sprays, composite indexes in the wrong order, indexes nobody can
name a query for, uniqueness that soft deletes silently break, plans never checked.
