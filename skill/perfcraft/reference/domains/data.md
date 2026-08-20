# Domain: Data-layer performance

The data layer is where most accidental slowness lives — and where the biggest measured wins are.
Query performance is a joint venture with `dbcraft` (schema and indexes); this domain owns the
*access patterns*.

## The query cost model

- **Every query in a request path is a line item** in the latency budget: count them, trace them,
  budget them. The N+1 loop is a thousand line items wearing one name (`anti-patterns.md` Q1).
- **Indexes are query-shaped** (`dbcraft`'s indexes domain): the hot queries' filters/sorts decide
  the indexes; the plan (`EXPLAIN ANALYZE`) decides whether the index actually gets used.

## The access-pattern rules

1. **Batch by key** — `WHERE id IN (:ids)` (chunked when large) instead of per-id queries;
   multi-row inserts instead of one-per-row.
2. **Project columns** — select what the response needs (`anti-patterns.md` Q3); wide rows cost
   bytes and buffer cache.
3. **Bound everything** — LIMIT/cursor pagination on every collection; load-all-then-filter is a
   full table in the app's memory (`anti-patterns.md` Q4).
4. **Push work into the engine** — filtering, aggregation, and sorting belong in SQL; the app
   should not be the database's slower twin.
5. **Measure with the plan, not hope** — every routine query gets `EXPLAIN ANALYZE` on
   production-sized data at least once per change cycle; sequential scans on hot paths are
   findings.

## ORM awareness

- ORMs hide the N+1 (lazy loading in a loop), the over-fetch (SELECT *), and the query count.
  Enable query logging/statements in development and *look* at the list — the ORM is the most
  productive generator of perf-slop.
- Eager-load exactly what the consumer needs; lazy-load when it sometimes does; never default.

## Connection management

- Pools with sane bounds (not "999 connections"), prepared statements, and transaction scoping
  that never spans I/O or user input (`dbcraft`'s queries domain).
- A saturated pool queues every request — pool wait time belongs in the trace (`domains/latency.md`).

## The measurement checklist

Query count per request · per-query time (trace) · rows scanned vs rows returned (the plan's
honesty check) · index usage · pool wait time · cache hit rate (`domains/caching.md`).

## Bans (recap)

N+1 loops, unbounded loads, SELECT *, app-side filtering, unindexed hot paths, ORM output never
looked at, pools misconfigured, plans unchecked.
