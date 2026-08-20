# Command: monitor

Production performance observability: the metrics, traces, and alerts that make performance a
continuous fact instead of a release-time guess. Performance you don't monitor is performance you
don't have.

## Steps

1. Map what's already visible (APM, tracing, RUM, dashboards) against what PERF.md tracks —
   the gaps are the work.
2. Fill the metric set per layer:
   - **Users** (`domains/web.md`): RUM — LCP/INP/CLS per device class and route, at p75/p95.
   - **Requests** (`domains/latency.md`): per-path P50/P95/P99 latency, queue time, error rate.
   - **Dependencies**: per-hop latency and failure rate, pool saturation, circuit-breaker state.
   - **Data** (`domains/data.md`): query count/time per request, cache hit rate, slow-query log.
   - **Runtime** (`domains/memory.md`): heap, allocation rate, GC pauses, event-loop lag.
3. Wire tracing so a slow request tells its whole story: one trace, all hops, attribution per
   span. The trace is the observability unit — logs and metrics hang off it.
4. Alert on percentiles and rates, with growth detection: P95 above budget for N minutes, memory
   growth over M hours, error rate spike — the OOM must never be the first signal
   (`perf-floor.md` Reflexes).
5. Tie it back to the gates: every budget in PERF.md has a monitoring counterpart — gate it in
   CI *and* watch it in production, or the gate is fiction.

## Rules

- Monitoring is for questions, not dashboards: each metric names the question it answers ("is
  checkout P95 inside budget?") — metric walls without questions are decoration.
- Percentiles everywhere; averages are banned from alerts (`domains/measurement.md`).
- Sampling is fine, silent is not: sampled traces are engineering; missing traces are faith.

## Exit criteria

- Every PERF.md budget has a metric + alert; the slow-request trace works end-to-end; the gaps
  list closed or scheduled.
