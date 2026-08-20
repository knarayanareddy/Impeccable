# Command: measure

The quantitative pass. Numbers, not adjectives. Complements `review` (judgment) and `audit`
(defects). No edits.

## What gets measured

1. **Journey coverage** — critical journeys vs journeys with: golden signals, an SLO, a
   dashboard row, and an alert (coverage % per layer).
2. **Log quality** — warn+ lines with the full contract (sampled): % structured, % with
   correlation ID, % generic-message lines, secrets/PII hits (checker).
3. **Metric quality** — % latency metrics with P95/P99; metric-name scatter count; orphaned
   metrics (no dashboard/alert queries them); cardinality of the top label sets.
4. **Trace quality** — % of spans crossing service boundaries; % of traces with a linked log
   (exemplar coverage); sampling rate and error-keep rate.
5. **Alert actionability** — % of alerts with owner + runbook; pages per shift (last N weeks);
   % of pages where the documented action was possible; flapping alerts count.
6. **SLO attainment** — per journey: SLO target, current attainment, error-budget burned this
   period, budget review cadence.
7. **Cost** — telemetry volume growth (logs/day, series count, span rate), retention vs policy,
   telemetry cost vs service cost.

## Output

A measurement report: per-metric tables with numbers, the floor comparison against
`signal-floor.md`, then the ranked delta list — cheapest change to highest 3 a.m. impact.

## Rules

- Every number cites its method (checker / store query / dashboard / inspection). If a metric
  can't be measured with available tooling, report "not measured" — never guess.
- Quote before/after numbers around any subsequent pass — that's how observability craft becomes
  visible.
