# Command: harden

Behavior under load: timeouts, backpressure, retry budgets, and degradation — make the overload
path as designed as the happy path (`perf-floor.md` #10 is the authority). Systems fail at the
knee, not in the lab; hardening is designing the knee.

## Steps

1. Enumerate the overload surface: every external call, queue, pool, and shared resource in the
   target — and what happens to each when the system is at 150% load.
2. For each, verify or implement:
   - **Timeouts inside the budget** — every external call has a timeout that fits its slice of the
     user budget (`domains/latency.md`); a hung dependency is an outage, not a wait.
   - **Retry budgets with backoff + jitter** — max attempts, exponential backoff, full jitter;
     retry only when `retryable` (`apicraft`'s errors domain agrees); no retry storms
     (`anti-patterns.md` P2).
   - **Backpressure** — bounded queues and pools; reject fast (503 + Retry-After) over accepting
     everything and hanging everyone (`domains/concurrency.md`).
   - **Circuit breakers** on dependencies — fail fast, shed load, recover with half-open probes.
   - **Degraded mode** — the designed fallback: stale cache, reduced features, read-only — the
     system stays *up*, degraded, instead of down.
   - **Rate limits** on expensive endpoints with visible headers (`apicraft`'s http domain).
3. Verify with a load test to the knee and past it: P95 stays inside the budget at target load;
   the degradation engages cleanly beyond it; nothing deadlocks, nothing thrashes.

## Exit criteria

- Every overload path has a named behavior (timeout/backoff/shed/degrade); the load test to the
  knee recorded with numbers; degradation path exercised, not just described.

## Rules

- Harden the *measured* failure modes — load-test first, then harden what the test showed.
- Crashing fast beats hanging slow: an explicit 503 is better than an implicit 30-second hang.
- Degradation is a product decision: which features degrade, and what the degraded experience
  is, gets the product's sign-off.
