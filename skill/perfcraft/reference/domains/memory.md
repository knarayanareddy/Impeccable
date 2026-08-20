# Domain: Memory

Memory behavior is the invisible half of performance: GC pauses, allocation storms, and leaks show
up as tail latency and midnight OOMs. What you don't measure here will measure you.

## The metrics that matter

- **Heap size over time** (and RSS) — the leak detector's raw material.
- **Allocation rate** — churn, not size, drives GC pressure.
- **GC pause times / counts** — the tail-latency contributor nobody profiles.
- **Working set** — what the process actually needs vs what it holds.

## Allocation discipline

- **Allocate once, reuse in the hot path** — buffers, builders, parsers: per-request allocation
  storms are the #1 fixable churn.
- **No deep clones in hot paths** (`JSON.parse(JSON.stringify(...))` per item) — structural
  sharing, or clone only what changes (`anti-patterns.md` M1).
- **String building via builders/joins, not concatenation in loops** (`anti-patterns.md` Q5) —
  O(n²) copying is also an O(n²) allocation storm.
- **Value types / stack allocation where the language offers it** (structs over classes in hot
  paths, `ref struct`/spans in C#, small strings over heap objects).

## Leaks and unbounded growth

- **Caches without bounds are leaks with a name** — every in-process cache is bounded (max
  entries/bytes) with an eviction policy (`domains/caching.md`).
- **Listeners/subscriptions never removed** — event listeners, timers, observers; the classic web
  leak.
- **Closures holding worlds** — a long-lived callback capturing a short-lived context pins
  everything the context touched.
- **Detached DOM nodes** (web) — removed from the tree but referenced by JS.

## The diagnosis loop

1. Heap profile / allocation trace → what allocates most?
2. GC log / pause histogram → when does the runtime stutter?
3. Heap snapshot diff over time (or after a repeat cycle) → what grows without bound?
4. Production memory metrics with growth alerting → the OOM must never be the first signal
   (`monitor`).

## The web specifics

- Bundle/parse memory counts too: giant JS bundles are memory before they're speed.
- Long-lived SPAs need teardown discipline (unsubscribe on unmount) or they accumulate.

## Bans (recap)

Unbounded caches, per-request allocation storms, deep-clone-in-loop, string-concat-in-loop,
unremoved listeners, leaks detected by the OOM, GC pauses unmeasured.
