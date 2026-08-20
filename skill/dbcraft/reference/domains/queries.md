# Domain: Queries

Queries are where the schema earns its keep. A good schema with bad queries is still slow and
unsafe; the craft covers both.

## Safety first

- **Parameterize everything.** Inputs enter via bound parameters — never string concatenation or
  interpolation into SQL (`anti-patterns.md` Q2). Dynamic identifiers (table/column names from
  input) are allowlisted, never interpolated.
- **UPDATE/DELETE carry WHERE — visibly.** The code review asks "where is the WHERE?"; multi-row
  mutations run in transactions with the affected count checked. A `DELETE FROM users` in a review
  is a defect, full stop.
- **Bounded result sets.** Every query either walks an index or carries a LIMIT. Unbounded scans on
  request paths are how timeouts happen.

## Set-based thinking (kill the N+1)

- One query with JOINs beats a loop of queries — at 1 row and at 100,000 rows.
- Batch by key: `WHERE id IN (:ids)` (chunked when the list is large) instead of per-id fetches.
- Eager-load relationships where the consumer always needs them; lazy-load where it sometimes does —
  the ORM's N+1 is still an N+1 (`anti-patterns.md` Q3).
- Watch for hidden loops: validation per row, enrichment per row, audit per row.

## Pagination

- **Keyset over offset at depth.** `WHERE (created_at, id) > (?, ?) ORDER BY created_at, id LIMIT 50`
  walks the index; `OFFSET 100000` walks the data. Offset is acceptable for shallow UI browsing only.
- Cursor encodes the sort tuple; the sort must be deterministic (id as the final tiebreak).

## Locking and concurrency

- **Lost updates are schema-shaped:** read-modify-write on shared rows needs `SELECT ... FOR UPDATE`
  (transactional), optimistic concurrency (`UPDATE ... WHERE version = ?` and check the row count),
  or atomic expressions (`UPDATE ... SET balance = balance - ?`). Pick per table and document it.
- Lock in a consistent order to avoid deadlocks (always account → user, never the reverse).
- Keep transactions short: no I/O, no external calls, no user input inside a transaction.

## Query structure

- **SELECT named columns**, never `SELECT *` in app code — schema changes must not silently break
  column-order assumptions (`anti-patterns.md` Q1).
- CTEs for readable multi-step logic (and `MATERIALIZED` hints where the planner needs them);
  window functions over self-joins for ranked/trailing data.
- Alias everything that joins; qualify every column in a join.

## Verify with the plan

- Every routine query gets `EXPLAIN ANALYZE` on production-sized data at least once per schema
  change cycle. Look for: sequential scans on hot paths, unused indexes, sort spills, nested loops
  against huge tables.
- The plan is the unit test of query craft. A query that "should be fast" but has no plan is
  unverified.

## Bans (recap)

Interpolated SQL, WHERE-less mutations, unbounded scans, N+1 loops, OFFSET at depth, `SELECT *`,
transactions with I/O inside, plans never checked, locks taken in inconsistent order.
