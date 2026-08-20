# Signal floor

Load this file **immediately before editing any instrumentation or alerting**. It is the
non-negotiable floor, the absolute bans, and the reflexes no detector catches. When the team's
published observability standards are stricter, theirs win.

## The floor

1. **Every critical user journey has an SLO.** SLI (what is measured) + target (how good) +
   window (over what period) — written down, owned, and burned against an error budget
   (`domains/slos.md`). A journey without an SLO has no definition of working.
2. **Every alert is actionable and owned.** The page names: the human action to take, the runbook
   (a link), and the owner. An alert where the on-call engineer can do nothing is noise — delete
   it, don't tune it (`domains/alerts.md`).
3. **Alerts fire on burn rate or sustained thresholds, never single samples.** One bad datapoint
   is not a page. Multi-window burn-rate alerts (fast burn + slow burn) catch real incidents
   without flapping (`domains/alerts.md`).
4. **Percentiles everywhere latency is measured.** P50/P95/P99 reported; averages are banned from
   alerts (`domains/metrics.md`).
5. **One correlation ID per request, through every hop.** Logs, spans, and downstream calls all
   carry it. A trace that stops at the service boundary is a trace that lies
   (`domains/traces.md`).
6. **Logs are structured at warn and above.** Fields, not prose: operation, subject, outcome,
   duration, correlation ID. A log line that needs parsing is a string, not a signal
   (`domains/logs.md`).
7. **No secrets, tokens, or raw PII in logs or traces.** Redaction at the source, deny-lists
   enforced in CI and at the collector. The log is a credential store unless you deny it the job
   (`seccraft`'s secrets domain agrees).
8. **Metrics are named in one vocabulary, defined once.** Metric names are constants, not string
   literals scattered through code. Same concept, same name, same labels — everywhere
   (`domains/metrics.md`).
9. **Every dashboard panel answers a question.** The panel states the question it answers and the
   journey it serves; panels that answer nothing get deleted (`dashboard`).
10. **Cost is budgeted.** Cardinality limits, sampling strategy, and retention are written
    decisions with owners — telemetry that costs more than the service it watches is a bug
    (`domains/telemetry.md`).

## Absolute bans (deterministic — most are caught by `scripts/check.mjs`)

- Secrets in log statements (password/token/key/authorization fields)
- Raw PII in log statements (email, SSN, card, phone — outside of clearly-redacted fields)
- "Something went wrong" / "An error occurred" / "Unknown error" as the whole message
- Log-per-item inside loops (log storms)
- String-concatenated log messages instead of structured fields
- Sync logging on the request hot path (one write per request = the observability tax)
- Averages as the only latency metric (`.mean()`/`avg()` with no percentile in sight)
- Metric names as scattered string literals (the same name in 3+ places)
- Alerts with no owner/runbook reference
- Outgoing calls without correlation-ID propagation in handler code
- No SLO/budget definition anywhere in the project

## Reflexes (no detector catches these)

- **The 3 a.m. test.** Can the on-call engineer find the cause from the telemetry alone — without
  opening the code? Walk the last incident's path; every step that needed the code is a gap.
- **Alert fatigue is a system failure.** When humans start ignoring pages, the alerting system —
  not the humans — is broken. Kill pages until every remaining one is worth a human.
- **Dashboards are answers, not decoration.** Every panel's question must survive the "would
  anyone act on this?" test. Orphaned panels are deleted, not kept "just in case".
- **The error budget is a decision.** Spending budget on features is legitimate; the SLO makes the
  spend visible. An error budget nobody looks at is a decoration.
- **Telemetry has a blast radius too.** Telemetry stores are sensitive systems: they contain
  secrets, PII, and the truth about the business. Access-controlled, encrypted, retained per
  policy.
- **Sampling is a design choice.** The sampling strategy is written (head vs tail, error
  over-sampling), and the answer to "is this in the sample?" is knowable.
