# Domain: Determinism

Flakiness is the suite's credibility problem. Every flake is a defect with a root cause — this
file is the taxonomy and the fixes. (`flaky` is the command; this is the knowledge.)

## The causes, and their fixes

| Cause | Smell | The fix |
|---|---|---|
| **Time** — wall-clock assumptions | "created 2 minutes ago", midnight/DST failures | Fake timers / inject the clock; freeze time per test |
| **Randomness** — unseeded | `Math.random()` inputs, shuffled fixtures | Seed per test (fixed or recorded); inject the RNG |
| **Async races** — sleep-as-sync | `sleep(500)` before assert | `waitFor(statePredicate)` with timeout; fake timers for scheduled work |
| **Order dependence** — shared state | passes alone, fails in suite (or vice versa) | `isolate`: fresh fixtures, per-test DB, no shared globals/files |
| **Data dependence** — env-specific | passes locally, fails in CI | Deterministic seeded data; never depend on pre-existing rows |
| **Resource contention** — parallelism | timeouts under load | Own the resource (per-test ports/DBs) or drop parallelism for the suite |
| **External flake** — third parties | calls to live services | Fake/record the service (WireMock, cassettes); never hit live in CI |
| **Locality** — timezone/locale | tz-dependent formats | Set TZ/locale explicitly per suite |

## The discipline

- **Reproduce first.** A flake you can't reproduce is a flake you can't fix. Loop the suspect test
  (with seed/order randomized runners) until it fails locally; bisect the cause.
- **Fix the cause, never mask it.** Retries (`jest.retryTimes`, `@flaky`) turn a 2-minute flake
  into a 6-minute flake and keep the root cause for the next suite. A retry is a stopgap with a
  ticket — not a fix.
- **Determinism is testable.** Randomize test order in CI (seeded shuffle), run each test in
  isolation, run the suite twice. The suite must prove its own independence.
- **Record and watch.** Track flaky history per test (the runner's retry logs); a test that flakes
  twice gets quarantined *with a ticket* and fixed — never silently quarantined forever.

## The async waiting pattern (the honest version of sleep)

```
await waitFor(() => expect(row).toBeVisible(), { timeout: 5000 });
```

The predicate is the contract; the timeout is the budget. Timeouts are generous in CI (5–10s),
and the wait is on *user-visible* state — not on internals.

## Bans (recap)

Sleep-as-sync, unseeded randomness, shared mutable state, live external calls in CI, retry
masking, quarantining without a ticket, flakes left unreproduced.
