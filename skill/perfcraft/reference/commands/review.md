# Command: review

Performance-craft review with scoring — the judgment pass `audit`'s defect scan and `measure`'s
numbers can't do alone: **would you believe this system's performance story?** No edits.

## Scorecard (1–5 each)

| Dimension | The question |
|---|---|
| Measurement discipline | Is every claim backed by a number with a percentile, an n, and an environment (`measurement.md`)? |
| Hot-path focus | Are optimizations aimed at the measured critical path — or scattered (`perf-floor.md` #5)? |
| Tail awareness | Does the story include P95/P99 — or hide in averages (`measurement.md`)? |
| Budgets & gates | Are the tracked interactions budgeted and CI-gated (`budget`)? |
| Caching contracts | Does every cache have a key/TTL/invalidation contract (`caching.md`)? |
| Concurrency correctness | Is parallelism measured, bounded, and race-clean (`concurrency.md`)? |
| Delivery discipline | Are assets sized, compressed, split, and cached (`delivery.md`)? |
| Memory awareness | Is allocation churn and growth measured and bounded (`memory.md`)? |
| Degradation design | Does the system fail at the knee *by design* (`harden`)? |
| User-clock alignment | Do the metrics track what the user perceives (`web.md`)? |

## Steps

1. Read PERF.md, the budget config, and the measurement history (dashboards, trace data, benchmark
   logs) as a skeptic would: what would you have to trust to believe the performance story?
2. Score each dimension with one "what's holding" and one "what's not" line, citing the specific
   number or absence — "no P95 anywhere" is a citation.
3. Deliver: the scorecard, the three highest-leverage fixes (ranked by tail-user impact), one
   honest strength, and one "bold move" — the single change that would most raise the
   performance story's credibility.

## Rules

- Review the evidence, not the intentions: "we're planning to measure" scores like "not measured".
- A budget without a gate, a cache without a contract, and a P50 without a P95 are each full
  findings, not dimension nits.
- No edits in review; follow-up commands (`profile`, `budget`, `cache`, `monitor`...) pick up the
  ranked list.
