# Measurement sheet: Backend

Loaded with `domains/latency.md` when the surface is backend services. The domains say *what*;
this sheet says *how* in this environment.

## The instruments

| Question | Instrument |
|---|---|
| Where does CPU time go? | CPU profiler / flame graph (pprof, py-spy, async-profiler, `perf`) — sample under real load |
| Where does latency go across hops? | Distributed tracing — queue time vs compute vs dependency per span |
| What's the tail made of? | Trace sampling at P99 (tail-keep sampling); GC logs; lock-contention profiles |
| What happens under load? | Load test (k6/JMeter) — find the knee where P95 leaves the budget |
| What allocates? | Allocation profiler / GC pause histogram (the memory domain's instruments) |

## The workflow

1. **Baseline + attribution before any fix**: P50/P95/P99 per hot path from traces; the
   flame graph's top frames are the candidate list (`domains/measurement.md`'s attribution
   rule).
2. **One fix, re-measured with the same harness**: same load shape, same data, same
   percentiles — quote before/after with n and conditions.
3. **The tail gets its own profile**: sample the P99 requests specifically — the tail's
   causes (GC, locks, cold caches) differ from the median's.
4. **Gate**: per-path budget slices (`budget`), load-test knee identified, alerts on the
   burn (`obscraft`'s SLO wiring).

## The environment rules

- Profile on production-shaped data and load — the dev laptop with 10 rows measures the dev
  laptop.
- Async I/O waits show in traces, not in CPU profiles — use the trace for latency, the
  profile for compute.
- The flame graph is the receipt: a fix that doesn't move it is furniture
  (`perf-floor` Reflexes).

## Bans

Means-only dashboards · un-profiled optimizations · tail unmeasured · load tests with no
knee identified · benchmarks on toy data.
