# Domain: Concurrency

Concurrency buys throughput at the price of correctness and complexity. The craft: parallelize only
the measured, partitionable, hot work — and prove the correctness before the speed.

## When parallelism pays (the gate)

1. **Measured** — the serial version was profiled and the work is the bottleneck.
2. **Partitionable** — the work splits into independent chunks (independent requests, independent
   rows, independent files). Shared mutable state disqualifies.
3. **Bound** — concurrency is bounded (a fixed pool, a semaphore), not "a goroutine per item"
   against a million items.
4. **Overhead-justified** — the work per chunk exceeds the coordination cost (spawning a thread
   for 50µs of work loses).

## The backend patterns

- **Async I/O over threads for I/O-bound work** — one event loop or a small pool serves thousands
  of concurrent waits; threads-for-waits is waste.
- **Bounded worker pools for CPU-bound work** — pool size ≈ cores (or cores × measured factor),
  queue with backpressure (`domains/latency.md`).
- **Batched parallelism** — `Promise.all` over bounded batches, goroutine groups with
  `errgroup`-style cancellation, not fire-and-forget.
- **Single-flight for identical work** — coalesce concurrent identical requests (`caching`'s
  stampede guard is the same pattern).

## The browser patterns

- **Web workers / off-main-thread** for heavy compute: parsing, encoding, search over big data.
- **`requestIdleCallback`** for non-urgent work; split long tasks so the main thread breathes
  (INP is a main-thread metric — `domains/web.md`).
- **No parallel DOM writes** — the DOM is single-threaded; batch instead (`anti-patterns.md` B3).

## The correctness guards (non-negotiable)

- **Shared state analysis first**: for every piece of shared state, name the synchronization
  (lock, atomic, channel, immutable snapshot) — or the parallelization doesn't ship.
- **Lost updates** (read-modify-write races) — atomic ops or optimistic versioning (`dbcraft`'s
  harden agrees).
- **Error semantics preserved**: one failing chunk fails the batch (cancel the rest); partial
  success is a designed, documented outcome — not an accident.
- **Backpressure** on every queue: unbounded queues are latency bombs under load
  (`harden`).

## The failure modes

- **Thread-per-item** — context-switch thrash disguised as scale.
- **Premature parallelization** — races and complexity for a path that wasn't hot
  (`anti-patterns.md` P1).
- **Thundering herds** — retry storms and stampedes without jitter/coalescing
  (`anti-patterns.md` P2).
- **Deadlocks** — lock ordering is written down and consistent (`dbcraft`'s queries domain
  agrees).

## Bans (recap)

Parallelism without a measurement, unbounded concurrency, shared state without synchronization,
fire-and-forget batches, error semantics ignored, queues without backpressure.
