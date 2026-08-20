# Command: parallelize

Add concurrency where it pays — with the correctness guards (`domains/concurrency.md` is the
authority). The most dangerous optimization: a race condition shipped as a speedup is the worst
kind of bug — intermittent and blamed on load.

## The gate (all must pass)

1. **Measured** — the serial version was profiled; the work is the bottleneck.
2. **Partitionable** — independent chunks; no shared mutable state (or the synchronization is
   named before the first line).
3. **Bounded** — a fixed pool/semaphore/batch size, never unbounded spawns.
4. **Overhead-justified** — the per-chunk work exceeds the coordination cost.

## Steps

1. State the shared-state analysis: every piece of state the concurrent version touches, and its
   synchronization (lock, atomic, channel, immutable snapshot). Write it before the code
   (`perf-floor.md` #9).
2. Choose the pattern per the work: async I/O for I/O-bound, bounded worker pool for CPU-bound,
   batched `Promise.all`/goroutine groups with cancellation, single-flight for identical work
   (`domains/concurrency.md`).
3. Preserve error semantics: one failing chunk fails the batch and cancels the rest — partial
   success is designed and documented, never accidental.
4. Add backpressure: bounded queues everywhere; rejection fast over hanging slow
   (`domains/latency.md`).
5. Measure: throughput and tail latency before/after — and run the race-detector/tests. The
   speedup ships only with both.

## Rules

- Never parallelize for aesthetics ("threads are modern") — the gate's first condition is a
  measurement.
- Never ship concurrency without the shared-state analysis in the change description.
- If the race detector complains, the optimization reverts — there is no "fast enough to ignore
  the race".

## Exit criteria

- Gate documented, pattern chosen with a reason, error semantics preserved, backpressure in
  place, before/after numbers + race-clean verification quoted.
