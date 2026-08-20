# Domain: Telemetry

Telemetry is the philosophy behind the three pillars. The differentiator domain: **observability is
not collecting data — it is answering questions.** Everything else in this skill is machinery for
this doctrine.

## The question-first doctrine

1. **Start from the questions**, not the signals: what must a human know to operate this system?
   ("Is checkout fast for real users?", "Which dependency slowed the feed?", "What did the user do
   before the error?")
2. **Map each question to a signal** — the cheapest pillar that answers it: a metric for "is it
   fast?", a trace for "which dependency?", logs for "what happened before?".
3. **Every signal names its question and its owner** in its definition (the metric name, the log
   contract, the panel title). A signal that answers nothing is deleted — deletion is the
   discipline.

## The three pillars, honestly

| Pillar | Answers | Cost model | Failure mode |
|---|---|---|---|
| **Logs** | "What happened, in order, with detail" | storage-heavy; retention-bound | log-everything → noise and bill |
| **Metrics** | "Is it fast/available/correct, aggregated" | cheap per series; cardinality-bound | averages, orphaned series |
| **Traces** | "Where did this request's time go" | sampling-dependent; span-volume-bound | dead-end spans, no strategy |

The pillars are one system: correlation IDs link them; exemplars embed a trace in a dashboard; the
log line carries the trace ID (`correlate`).

## The golden signals (per journey, not per server)

Latency (percentiles), traffic (rate), errors (rate by class), saturation (of the journey's
bottleneck — queue depth, pool, connection count). The four signals answer "is the user's journey
healthy?" — server-level CPU is an ingredient, not the answer.

## Cost and privacy are design parameters

- **Cardinality budgets:** bounded label sets per metric, no unbounded dimensions (`metrics.md`).
- **Sampling strategy:** written (head vs tail, error over-sampling), not defaulted (`traces.md`).
- **Retention tiers:** hot (days, queryable), warm (weeks, aggregated), cold (compliance). A
  retention decision per data class (`seccraft`'s data domain agrees).
- **Privacy:** telemetry stores contain secrets, PII, and business truth — access-controlled,
  encrypted, redaction at the source (`logs.md`).

## Bans (recap)

Signal-without-question, question-without-owner, pillar soup (the same question answered thrice
while another goes unanswered), unbounded cardinality, telemetry costing more than the service,
privacy-naive telemetry stores.
