# Domain: Metrics

Metrics answer "is it fast, available, correct — aggregated." The craft: the right type, the right
percentiles, one vocabulary, bounded cardinality.

## The four types, used correctly

| Type | For | Wrong use |
|---|---|---|
| Counter | Monotonic counts (requests, errors, bytes) | never decreases; rates derive from it |
| Gauge | Current values (queue depth, in-flight, temp) | rates from gauges lie — the sample misses the spikes |
| Histogram | Distributions (latency, sizes) — **with percentiles** | pre-aggregated means destroy the tail |
| Summary | Client-side percentiles (when server-side histograms aren't possible) | the same distribution twice |

## Percentiles, always

- **P50/P95/P99** for every latency histogram; the average is a summary for people who don't want
  the answer (`anti-patterns.md` M1). Alerts fire on P95/P99, never on means
  (`signal-floor.md` #4).
- Histogram buckets must cover the tail: the 99th percentile needs buckets up there. Default
  buckets that top out at the median are a lie in dashboard form.

## Naming: one vocabulary, defined once

- Name = domain + what + unit: `http_request_duration_seconds`, `checkout_payment_total`. One
  convention (dots vs underscores) app-wide.
- **Metric names are constants, not string literals** — the same name written in three files is
  three opportunities for a typo'd series that silently diverges (`anti-patterns.md` M2,
  `metric` fixes this).
- Labels name the dimensions that answer questions (`status`, `route`, `journey`) — and only
  those.

## Cardinality (the budget that bites)

- **Bounded label sets:** status codes are 5 values; user IDs are not a label. High-cardinality
  dimensions (user, URL, email) explode the store's cost and query time (`anti-patterns.md` M3).
- Drop dimensions that answer no question; aggregate what you don't need per-request
  (`telemetry.md`'s cost doctrine).
- **One metric per question** — merging five questions into one metric with five labels is how
  dashboards become unreadable.

## The lifecycle

Every metric: named question → defined in the vocabulary → emitted once → queried by a dashboard
or alert → reviewed for removal when its question dies (`anti-patterns.md` M4). A metric nobody
queries is tax; delete it.

## Bans (recap)

Means-only, scattered names, unbounded labels, orphaned series, wrong-type math, buckets that
miss the tail.
