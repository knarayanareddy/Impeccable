# Measurement sheet: Data layer

Loaded with `domains/data.md` when the surface is the database/query layer. The domains say
*what*; this sheet says *how* in this environment — and this is the layer where the biggest
measured wins live.

## The instruments

| Question | Instrument |
|---|---|
| Is the query index-backed? | `EXPLAIN (ANALYZE, BUFFERS)` (Postgres) / `EXPLAIN ANALYZE` (MySQL) / `EXPLAIN QUERY PLAN` (SQLite) — sequential scans on hot paths are findings |
| How many queries per request? | Trace spans per DB call; ORM query logging in development — *look at the list* |
| What's the cache hit rate? | The cache layer's stats (hit/miss, eviction) — feeds the caching contract |
| Where's the pool pressure? | Pool wait time in traces; saturation gauges (obscraft's golden signals) |
| What's the bloat/maintenance state? | Table/index bloat stats; autovacuum logs (Postgres) |

## The workflow

1. Collect the hot queries (from DATA.md / the trace's DB spans / the ORM's query list).
2. Plan-check each on production-sized data — rows scanned vs rows returned is the honesty
   metric (`domains/data.md`'s checklist).
3. Fix one access pattern (batch, project, bound, index); re-plan; quote before/after
   (rows scanned, time, n).
4. Gate: the hot-query list stays index-backed; pool saturation and query counts are
   dashboarded and alerted (`obscraft`'s SLO wiring).

## The environment rules

- `EXPLAIN` on toy tables proves nothing — the plan changes with data volume.
- The ORM hides the N+1, the over-fetch, and the query count — enable statement logging and
  read it, the ORM is the most productive generator of perf-slop (`anti-patterns.md`).
- Indexes are query-shaped (`dbcraft`'s indexes domain is the authority on the shape); this
  sheet owns measuring whether the shape works.

## Bans

Plans unchecked · app-side filtering · unbounded loads · pool waits untraced · toy-data
EXPLAINs · cache hit rates unmeasured.
