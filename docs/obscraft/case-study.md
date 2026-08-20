# Case study: the generic AI telemetry → the obscraft pass

A before/after case study driven by the deterministic checker and the telemetry-shape gate —
the measured transformation, both directions, plus the definitions gate.

## The before

A typical AI-generated checkout handler (`demos/obscraft/before.js`): an API token and raw PII
in the log line, string-concatenated messages, a log-per-item loop, a mean-only latency
metric, the same metric name scattered as three literals, a generic error, and no
correlation propagation — plus the definitions (`before-slo.yaml`, `before-alerts.yaml`):
a 100% SLO target with no owner, and an alert on an `avg()` with no owner or runbook.

The checker's verdict (`node skill/obscraft/scripts/check.mjs --strict`):

```
ERROR secret-in-log              before.js:6   token in the log statement
WARN  pii-in-log                 before.js:6   email
WARN  string-concat-log          before.js:6   concatenated log message (×2)
WARN  log-in-loop                before.js:8   log in loop
WARN  mean-only-metric           before.js:10  .mean(
WARN  generic-error              before.js:14  Something went wrong
WARN  metric-name-scatter        before.js:1   checkout_errors_total ×3
WARN  no-correlation-propagation before.js:1   the trace dies at the boundary

obscraft: 1 file(s) scanned · 1 error(s), 8 warning(s) · FAILED
```

And the shape gate:

```
GAP slo   missing-owner        SLO "checkout-availability" has no owner
GAP slo   impossible-target    target 100 — unspendable and uninformative
GAP alert missing-owner        Alert "CheckoutHighLatency" has no owner
GAP alert missing-runbook      … no runbook
… 4 gaps · FAILED
```

## The pass

One obscraft pass — `log` (structured fields, correlation ids, the batch line), `metric`
(percentiles, one vocabulary constant), `correlate` (traceparent on the hop), `slo` (99.9%
with an owner), `alert` (burn-rate with owner + runbook) — produces `demos/obscraft/after.js`
+ `after-slo.yaml` + `after-alerts.yaml`:

```
obscraft: 1 file(s) scanned · 0 error(s), 0 warning(s) · clean ✓
telemetry-check: all shapes valid ✓
```

## The claim

The transformation is verifiable in both directions, and the definitions are a *gate* — an
SLO that loses its owner or an alert that loses its runbook fails the build. Observability
craft with a receipt.
