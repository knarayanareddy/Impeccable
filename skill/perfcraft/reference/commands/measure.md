# Command: measure

The quantitative pass. Numbers, not adjectives. Complements `profile` (attribution) and `audit`
(defects). No edits.

## What gets measured

1. **Web vitals** (`domains/web.md`): LCP / INP / CLS / TTFB — lab (Lighthouse) and RUM if
   available, at the p75 and p95.
2. **Latency** (`domains/latency.md`): per-hot-path P50/P95/P99/max from traces or logs; queue
   time vs compute split; dependency hop breakdown.
3. **Payloads** (`domains/delivery.md`): total and per-class bytes (JS/CSS/images/fonts); largest
   10 assets; unused-bytes report where a bundle analyzer exists.
4. **Data layer** (`domains/data.md`): query counts per request; rows scanned vs returned on hot
   queries; index usage from the plans.
5. **Memory** (`domains/memory.md`): heap over time, allocation rate, GC pause stats, working set.
6. **Concurrency** (`domains/concurrency.md`): pool saturation, queue depths, in-flight requests.
7. **Gates**: which budgets from PERF.md exist, which are enforced in CI, current vs budget per
   interaction.

## Output

A measurement report: per-metric tables with numbers and percentiles, the budget comparison
(current vs target, pass/fail per interaction), then the ranked delta list — cheapest change to
highest measured impact.

## Rules

- Percentiles and n for every latency number; the environment stated (lab vs RUM vs production).
- If a metric can't be measured with available tooling, report "not measured" — never guess.
- Quote before/after numbers around any subsequent optimization — that's how perf craft becomes
  visible.
