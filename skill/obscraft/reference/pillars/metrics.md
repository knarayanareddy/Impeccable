# Pillar sheet: Metrics

Loaded with `domains/metrics.md` when the work is metrics. The domain says *what* a metric
must be; this sheet says *how* to get there in a real codebase.

## The instruments

| Question | Instrument |
|---|---|
| Are the series real? | The metrics store's query — a defined constant that emits nothing is a stub, not a metric |
| Are percentiles covered? | Histogram bucket review — the buckets must reach the tail (`metrics.md`'s bucket rule) |
| Is cardinality bounded? | The store's series count per metric — unbounded labels are a bill, not a feature |
| Who queries it? | Dashboard/alert backlinks (`telemetry.md`'s question-first doctrine) — orphans get deleted |

## The workflow

1. **Define once, emit once**: the vocabulary module holds name + type + labels + question
   (the `telemetry-check` metrics shape); code references the constant, never the string.
2. **Buckets for the tail**: latency histograms get buckets past the P99 (`metrics.md`'s
   tail rule); means are banned from alerts.
3. **Bound the labels**: statuses, routes, journeys — never user ids, URLs, emails
   (`anti-patterns.md` M3).
4. **Wire the question**: every metric lands in a dashboard panel or an alert whose title
   states its question — or the metric is deleted (`metric`'s orphan rule).

## The bans to enforce

Mean-only latency (`mean-only-metric`) · scattered string literals (`metric-name-scatter`) ·
unbounded cardinality · orphans · wrong-type math (rates from gauges).

## Bans

Un-named series · missing buckets · label explosions · orphaned metrics · averages in
alerts · strings instead of constants.
