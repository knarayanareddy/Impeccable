# Command: audit

Defect scan: N+1s, sync I/O, payload bloat, jank sources, and missing gates. Finds and ranks — it
does not fix. No code edits.

## Steps

1. Run `scripts/check.mjs --target <path>` for the deterministic set (N+1 patterns, sync I/O,
   `SELECT *`, unbounded loads, busy retries, layout/DOM thrash, deep clones, string-concat loops,
   heavy images, missing budget/gate config).
2. Inspect what the checker can't see:
   - **Query paths** (`domains/data.md`): per-request query counts, unindexed hot queries, ORM
     lazy-load traps, unbounded collections.
   - **Request paths** (`domains/latency.md`): missing timeouts, per-request setup, unbounded
     queues, sync logging in the path.
   - **Frontend** (`domains/web.md`, `domains/delivery.md`): render-blocking assets, unoptimized
     images, vendor bloat, main-thread heavy work, layout shift risks.
   - **Caching** (`domains/caching.md`): caches without invalidation contracts, stampede risks.
   - **Gates** (`budget`): which tracked interactions have no budget or no CI enforcement.
3. Rank by measured (or estimated-then-flagged) impact on the hot paths from PERF.md — the audit
   reports *where the slop lives*, not just that it exists.
4. Output a ranked punch list: severity (Blocker / Major / Minor / Nit), file:line, rule, and the
   fix. Blockers = perf-floor violations. Sort by severity, then by hot-path impact.

## Rules

- Cite file:line for every finding; never vague impressions.
- Audit does not edit. The fix is a follow-up command (`optimize`, `cache`, `defer`, `budget`...).
- Unmeasured impact is labeled "to profile", not asserted — audit's job is the map, `profile`'s
  is the receipt.

## Exit criteria

- The punch list ranked and delivered, with the deterministic findings and the inspection
  findings separated; a one-line verdict and counts per severity.
