# Command: index

Design indexes from the query patterns — and remove the ones nothing uses (`domains/indexes.md` is
the authority). The most measurable performance pass in the skill.

## Steps

1. Collect the hot queries (from DATA.md's list, the code, or the query logs). For each: the filter
   columns, the sort, the selected columns.
2. Derive the needed indexes per query, then merge: one composite per access path, equality columns
   first, ranges next, sorts last (`indexes.md`).
3. Check the must-haves: every FK indexed; soft-delete uniqueness handled via partial index;
   covering columns (INCLUDE) where index-only scans pay.
4. Check the dead weight: existing indexes that serve no query in the hot list — flag for removal
   (after verification with the engine's usage stats, `pg_stat_user_indexes` and friends).
5. Implement via migration, non-locking: `CREATE INDEX CONCURRENTLY` (or the engine's equivalent);
   no index creation on hot tables without the concurrent form.
6. Verify with the plan: `EXPLAIN ANALYZE` before and after on production-sized data — the index
   must actually be used by the query it was designed for. Quote the numbers (rows scanned, time).

## Exit criteria

- Every hot query index-backed, verified by plan; every FK indexed; unused indexes removed or
  scheduled; before/after plans quoted.

## Rules

- Never index "just in case" — each index names the query it serves, in a comment or DATA.md.
- An index that doesn't change the plan is a mistake to remove, not an achievement to keep.
- Write amplification is real: on write-heavy tables, the minimum set that serves measured reads
  wins.
