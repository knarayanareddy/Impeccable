# Command: instrument

Add logs, metrics, and traces to a service, from `shape`'s signals table. The implementation pass —
every signal lands with its question intact.

## Steps

1. Take the approved signals table (or build a minimal one if the request came without it —
   never instrument without questions).
2. Implement per pillar:
   - **Metrics** (`domains/metrics.md`): the journey's golden signals — latency histogram with
     real buckets, traffic counter, error counter by class, saturation gauge; names from the
     vocabulary, defined once as constants. Use the OTel semantic conventions for
     infrastructure-shaped signals (`http.server.request.duration` etc.) and set the resource
     attributes (`service.name`, `service.version`) once.
   - **Traces** (`domains/traces.md`): spans at every boundary (HTTP client, DB, queue), span
     attributes (subject, outcome, sizes), the sampling strategy applied.
   - **Logs** (`domains/logs.md`): the warn+ events per the line contract — structured fields,
     correlation + trace IDs, no secrets/PII (verify against the deny-list).
3. Wire the correlation ID through every hop — incoming context into every outgoing call
   (`correlate` handles the gaps; instrument installs the plumbing).
4. Verify each signal flows end-to-end: the metric appears with the right labels, the span links
   in the trace view, the log line renders as fields and joins the trace.
5. Record the instrumentation in OBSERVABILITY.md — the question each signal answers, so the next
   reader doesn't re-derive it.

## Rules

- Instrument the questions from `shape` — no creative extras (the extra metric is tomorrow's
  orphan).
- Secrets/PII redaction is part of the instrumentation, not a later pass (`signal-floor.md` #7).
- The 3 a.m. test runs before merge: page → dashboard → trace → log must work on a synthetic
  failure.

## Exit criteria

- Every signal from the table implemented and verified flowing; correlation ID end-to-end; the
  synthetic-failure walk succeeds; the instrumentation recorded.
