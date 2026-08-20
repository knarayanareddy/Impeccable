# Command: metric

Metric craft: names, percentiles, cardinality (`domains/metrics.md` is the authority). The pass
that turns scattered counters into a vocabulary.

## Steps

1. Inventory the metrics in the target: names (as literals), types, labels, and who queries each
   (dashboards/alerts).
2. Fix per the rules:
   - **Vocabulary:** every name to the convention (domain + what + unit); names become constants
     in one definitions module (`anti-patterns.md` M2).
   - **Percentiles:** latency distributions become histograms with tail-covering buckets; means
     become P50/P95/P99 (`anti-patterns.md` M1).
   - **Types:** counters vs gauges vs histograms corrected (`metrics.md`'s table).
   - **Cardinality:** unbounded labels (user IDs, URLs, emails) dropped or bounded
     (`anti-patterns.md` M3).
   - **Orphans:** metrics no dashboard or alert queries are deleted — each survivor names its
     question.
3. Verify: the metric names appear once as definitions; the dashboards still render (or better);
   the store's series count drops or holds per the cardinality budget.

## Exit criteria

- One vocabulary, defined once; percentiles everywhere latency is measured; cardinality bounded;
  orphaned series removed; the definitions module in the repo.

## Rules

- Metric fixes the *signals*, not the pipeline (`monitor`'s scope).
- Never keep a metric "because it might be useful" — a metric must name its question
  (`telemetry.md`).
- Label sets answer questions; a label that answers nothing is cardinality tax.
