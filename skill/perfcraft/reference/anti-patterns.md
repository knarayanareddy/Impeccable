# Anti-patterns: the perf-slop tells

The fingerprints of "optimization" done by an agent (or a team) without a measurement — theater,
not engineering. Each is a defect. Most have a deterministic rule in `scripts/check.mjs`; the rest
are LLM-judged with this file loaded.

## Optimization-theater tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| O1 | Optimizing without a measurement | The change is a bet; nobody knows if it won | `profile` first; cite before/after numbers |
| O2 | Micro-optimizing cold paths (bit-twiddling a function called once a day) | Complexity added where no time is spent | Optimize the top of the flame graph, not the bottom |
| O3 | Benchmark theater (no warmup, one run, cherry-picked inputs) | The benchmark measures itself | Warmup + repetitions + variance + real-shaped data |
| O4 | Averages as the only number | Hides the tail; the tail is the users | P50/P95/P99 and max, always |
| O5 | `sleep()` as tuning | Slows everything, fixes nothing, flakes later | The actual fix, or honest async |

## Query & data tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| Q1 | N+1 query loops (query per item in a loop) | Latency scales with data; the classic accidental slowness | Batch: `WHERE id IN (...)`, joins, eager loading |
| Q2 | Hot query without an index (full scans on request paths) | Linear cost per row, forever | `dbcraft index` — verify with the plan |
| Q3 | `SELECT *` / over-fetching | Bytes and parsing nobody needs | Named columns; projection |
| Q4 | Unbounded collections (load all rows, filter in memory) | The DB ships its whole life to the app | WHERE/SQL-side filtering, pagination |
| Q5 | String concatenation in loops (O(n²) building) | Quadratic copying in the hottest loop | `StringBuilder` / `strings.Builder` / array-join |

## I/O & blocking tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| B1 | Sync I/O in request paths (`readFileSync`, `execSync`) | One blocked worker per request | Async I/O; streams |
| B2 | Blocking the main thread (heavy compute, deep recursion) | One frozen tab; INP destroyed | Web workers, splitting, off-main-thread |
| B3 | DOM thrash (`innerHTML +=` in loops, read-write-read layout thrash) | Re-parse and reflow per iteration | Build once, insert once; batch reads and writes |
| B4 | Busy retry loops (`while (true) { fetch() }`) | A spin loop with a network card | Backoff + jitter + max attempts |

## Cache tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| C1 | Cache-everything with no invalidation contract | Stale data shipped with confidence | Key + TTL + invalidation path, written down |
| C2 | Cache keys too broad or too narrow | Poisoning, or a cache that never hits | Key = the exact inputs that determine the output |
| C3 | Premature caching (memoize the cold path) | Memory + complexity for a path nobody walks | Cache only the measured hot path |

## Delivery tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| D1 | Megabyte images, unoptimized, un-lazy | The #1 payload cost on most pages | Correct format/size, srcset, loading=lazy, width/height |
| D2 | Vendor bloat (whole library for one function) | 500KB shipped for 2KB used | Tree-shake, dynamic import, replace |
| D3 | Ship-without-budget (no regression gate) | Performance rots silently, sprint by sprint | `budget`: budgets as code + CI gates |
| D4 | Spinner for predictable sub-second ops | Flicker and reflow where optimism belongs | Optimistic UI / skeleton that preserves layout |

## Concurrency tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| P1 | Premature parallelization (threads for nothing) | Context-switch cost + race conditions as a "win" | Parallelize only the measured, partitionable, hot work |
| P2 | Retry storms without jitter | Every failure becomes a thundering herd | Backoff with full jitter, retry budgets |
| P3 | Logging in the hot path (sync logging per request) | The observability tax eats the latency budget | Async/batched logging, sampling |

## Memory tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| M1 | Deep clones in hot paths (`JSON.parse(JSON.stringify(x))` per item) | GC churn and allocation storms | Structural sharing, mutation with care, structuredClone only when needed |
| M2 | Leaks unmonitored (no memory metric on the dashboard) | The OOM arrives before the alert | Memory metrics + growth alerting (`monitor`) |

## Detector mapping

`scripts/check.mjs` deterministically catches: Q1 (loop + per-item query), B1 (sync I/O calls), Q3
(`SELECT *`), Q4 (unbounded `.find()`/`findAll()`), B4 (busy retry loops), B3 (layout-thrash reads
in loops, `innerHTML +=`), M1 (deep clone), Q5 (string concat in loops), D1 (image files > 1MB),
D3 (no budget/gate config found in the project). The rest are LLM-judged — keep this file loaded
when auditing or profiling.
