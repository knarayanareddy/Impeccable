# Command: review

Judgment review with scoring — the pass `audit`'s defect scan can't do alone. The one question:
**could on-call debug the last incident from this telemetry alone, at 3 a.m.?** No edits.

## Scorecard (1–5 each)

| Dimension | The question |
|---|---|
| Question coverage | Does every critical journey have signals answering health/attribution/story (`telemetry.md`)? |
| Log craft | Structured, leveled, secret-free (`logs.md`)? |
| Metric craft | Percentiles, one vocabulary, bounded cardinality (`metrics.md`)? |
| Trace completeness | Do traces cross every boundary and link to logs (`traces.md`)? |
| SLO posture | Journeys have SLIs, targets, owners, and spent budgets (`slos.md`)? |
| Alert actionability | Would every page survive the "human can act" test (`alerts.md`)? |
| Dashboard truth | Do panels answer questions; are orphans gone (`dashboards.md`)? |
| Incident readiness | Has the 3 a.m. walk been run and the gaps closed (`incidents.md`)? |
| Cost & privacy | Cardinality, sampling, retention budgeted; secrets/PII out (`telemetry.md`)? |
| Operability | Is the telemetry itself operated (uptime, upgrades, owners)? |

## Steps

1. Read the telemetry as the on-call engineer would: from the alert, through the dashboard, into
   the trace and logs. Note every stumble.
2. Score each dimension with one "what's holding" and one "what's not" line, citing the exact
   signal, alert, or absence — "no SLO on checkout" is a citation.
3. Deliver: the scorecard, the three highest-leverage fixes (ranked by 3 a.m. impact), one honest
   strength, and one "bold move" — the single change that would most raise the system's
   observability truth.

## Rules

- Review the telemetry's truth, not the team's intentions: "we'll add tracing later" scores as
   "traces don't exist".
- A journey with no SLO, a page with no action, and a pillar that doesn't link are each full
   findings, not dimension nits.
- No edits in review; follow-up commands (`slo`, `alert`, `correlate`, `instrument`...) pick up
   the ranked list.
