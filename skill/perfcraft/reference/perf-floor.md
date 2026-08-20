# Perf floor

Load this file **immediately before editing any performance-sensitive code**. It is the
non-negotiable floor, the absolute bans, and the reflexes no detector catches. When the team's
published performance policy is stricter, theirs wins.

## The floor

1. **Every optimization has a number.** A before/after measurement (profile, benchmark, or trace)
   names the problem and the gain. No number, no optimization — it's a bet, and bets don't ship as
   wins (`domains/measurement.md`).
2. **Percentiles, not averages.** P50/P95/P99 (and max, for capacity). Averages hide the tail, and
   the tail is the user experience: one in twenty users with a 4-second checkout is a business
   problem, not a rounding error.
3. **Measure in the real environment.** Production-shaped data, production-shaped load, the real
   device classes. A benchmark that only runs on the dev laptop measures the dev laptop.
4. **Benchmarks warm up and repeat.** Warmup runs, multiple iterations, reported variance. One run
   is noise; a benchmark without variance is an anecdote.
5. **Optimize the measured hot path.** The profile's attribution names the top frames; fixes target
   them. Optimizing anything below the top of the flame graph is theater
   (`domains/measurement.md`).
6. **Budgets live in CI.** Every tracked interaction has a budget (LCP < 2.5s, INP < 200ms,
   P95 < target) enforced by a regression gate (`budget`). A regression that doesn't fail CI is a
   feature, not a regression.
7. **No N+1s, no sync I/O in request paths, no unbounded data.** The three deterministic tells of
   accidental slowness (`anti-patterns.md`).
8. **Every cache has an invalidation contract.** Key shape, TTL, and the invalidation path —
   written where the cache is introduced. A cache without invalidation is a bug with a timer
   (`domains/caching.md`).
9. **Concurrency preserves correctness.** Parallelism ships with the data-race and lost-update
   analysis; async ships with backpressure (`domains/concurrency.md`).
10. **Degradation is designed.** Under load: timeouts, retry budgets with backoff + jitter, circuit
    breakers, and a degraded mode. Failing fast beats hanging slow (`harden`).

## Absolute bans (deterministic — most are caught by `scripts/check.mjs`)

- Optimization without a measurement (the change cites no number)
- Micro-optimization of cold paths
- Averages as the only reported metric
- N+1 query loops (loop + per-item query; batch with `IN (...)` or `Promise.all`)
- Sync I/O in request paths (`readFileSync`, `writeFileSync`, `execSync`, `spawnSync`)
- `SELECT *`, unbounded `.find()`/`findAll()`, load-everything-then-filter-in-memory
- Busy retry loops without sleep/backoff (`while (true) { fetch() }`)
- Cache-everything with no invalidation path
- Megabyte images, unoptimized, un-lazy
- Shipping a whole vendor library for one function
- Blocking the main thread with heavy computation
- Forced layout thrash (read-write-read in loops: `getBoundingClientRect`/`offsetHeight` in a loop)
- `innerHTML +=` in a loop (re-parse + reflow per iteration)
- Retry storms without backoff/jitter
- Spinner for predictable sub-second operations (perceived-performance failure)
- `sleep()` as performance tuning
- Premature parallelization (threads for nothing)
- String concatenation in loops where a builder/join exists
- Deep clones (`JSON.parse(JSON.stringify(...))`) in hot paths
- Ship-without-budget (no regression gate anywhere)

## Reflexes (no detector catches these)

- **The user's clock is the only clock.** Server-side numbers matter only as they surface to users.
  Trace the full path: request → queue → compute → response → render → interactive.
- **The flame graph is the receipt.** Optimizations cite their attribution. If the fix doesn't move
  the graph, it didn't fix anything — it moved furniture.
- **Fast code that's wrong is slow.** Every optimization change carries its behavior tests; a
  "fast" result that's wrong is a bug with better marketing.
- **The tail is the experience.** Report the worst users, not the average one. Latency budgets are
  tail budgets.
- **Latency budgets cascade.** Every service in the critical path gets a budget slice; the slices
  must sum to the user budget. A 2.5s LCP budget isn't one number — it's a chain of contracts.
- **The regression gate is the memory.** Optimizations without a gate are reverted by next
  quarter's refactor. The gate, not the engineer, keeps performance true.
- **Complexity is the price of optimization.** Each fix adds machinery (cache, worker, index). The
  receipt must show the measured gain outweighs the added complexity — or the fix doesn't ship.
