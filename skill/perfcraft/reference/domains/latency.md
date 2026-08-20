# Domain: Latency (backend)

Latency is the budget the user feels. Every millisecond in the request path is a millisecond of
theirs; the craft is knowing where each one goes.

## The latency anatomy (trace every stage)

```
request → accept/queue → auth → route → [dep. calls] → [db] → serialize → respond
           queue time      p50/p95 each hop:  attribution via tracing
```

- **Queue time is the silent killer** — requests waiting for workers, connections, or locks. It
  shows in traces, never in the code.
- **Serialization and deserialization** are routinely the top CPU frames in API services — measure
  before assuming business logic is the cost.
- **Every dependency hop** has its own latency distribution; the path's P95 is not the sum of the
  hops' P95s — correlate, don't add.

## The request-path rules

- **No sync I/O, ever, in a request handler** (`anti-patterns.md` B1) — one blocked worker per
  request.
- **No unbounded work**: bounded queries, bounded payloads, bounded timeouts on every external
  call (a hung dependency is an outage).
- **Pools, not per-request setup**: connection pools, HTTP clients with keep-alive, prepared
  statements — pay setup once, not per request.
- **Batch, don't loop**: `IN (...)`/joins over per-item queries (`anti-patterns.md` Q1).

## Throughput vs latency (they trade)

- Concurrency buys throughput, not latency: a worker pool that queues at 100% utilization turns
  fast requests into slow queues. Leave headroom; watch queue depth.
- Backpressure over unbounded queues (`domains/concurrency.md`): reject fast (503 + Retry-After)
  rather than accept everything and hang everyone.
- Little's law is the intuition: in-flight work × time-per-item = time-in-queue. Cut either.

## The tail problem

- **GC pauses, lock contention, log flushes, cold caches** — the tail is made of these, not of the
  median path. Profile the P99 requests specifically (trace sampling at the tail).
- Timeouts must sit *inside* the dependency budgets: if the user budget is 2s and the DB gets 1.5s,
  the DB timeout is 1.5s — not 30s of hope.

## Capacity planning

- Load test at production-shaped traffic, find the knee (where P95 leaves the budget), and set the
  alert below it. "It handled the test" is not a number; "knee at 1,400 rps, budget P95 180ms, alert
  at 1,200 rps" is.

## Bans (recap)

Sync I/O in handlers, no timeouts, unbounded queues, per-request setup, loop-queries, P95
unmeasured, load tests with no knee identified.
