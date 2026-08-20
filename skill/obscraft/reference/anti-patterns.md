# Anti-patterns: the observability-slop tells

The fingerprints of telemetry written by an agent (or a team) that instrumented nothing, then
everything, then called it observability. Each is a defect — not always an incident today, always
a 3 a.m. mystery someday. Most have a deterministic rule in `scripts/check.mjs`; the rest are
LLM-judged with this file loaded.

## Logging tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| L1 | Log-everything (`console.log` per step) | Noise drowns the signal; the bill drowns the budget | Log levels per contract; debug in dev, warn+ in prod (`log`) |
| L2 | Log-nothing ("we'll add logs when we need them") | The incident arrives and the telemetry doesn't exist | `instrument`: the floor's events before production |
| L3 | "Something went wrong" as the whole message | The log says nothing; the engineer opens the code | operation + subject + outcome + error + correlation ID |
| L4 | Unstructured prose logs (string concat) | Every query is a parsing project | Structured fields (`logs.md`) |
| L5 | Log-per-item inside loops | A log storm; the loop's bug floods the store | One aggregate log per batch (`log`) |

## Metric tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| M1 | Averages as the only latency number | The tail is hidden; the tail is the users | P50/P95/P99 (`metric`, `perfcraft` agrees) |
| M2 | Metric names as scattered string literals | Typo'd names diverge silently into separate series | Constants in one vocabulary (`metrics.md`) |
| M3 | Unbounded cardinality (user IDs, URLs, emails as labels) | The metric store's bill and query time explode | Bound labels; drop high-cardinality dimensions |
| M4 | Metrics nobody queries | Instrumentation tax with no reader | Delete; a metric must name its question |
| M5 | Counter vs gauge confusion (rates made from gauges) | The math lies quietly | The right type per the question |

## Tracing tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| T1 | No correlation ID through the boundary | The trace dies at the first hop | Propagate the ID on every outgoing call (`correlate`) |
| T2 | Spans that stop at the service edge | "Slow checkout" with no downstream attribution | Instrument the client calls, not just the handler |
| T3 | No sampling strategy (all or nothing) | Cost explosion or invisible tails | Written strategy; over-sample errors (`trace`) |
| T4 | Traces that don't link to logs | Two half-stories about the same request | Trace IDs in log lines; exemplars on dashboards |

## Alert tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| A1 | Alerts nobody can act on ("CPU > 80%" with no playbook) | The page trains humans to ignore pages | Actionable pages only (`alerts.md`) |
| A2 | Alert fatigue (pages for everything, then nothing) | The ignored page is the incident | Burn-rate alerts; kill until each page earns a human |
| A3 | Single-sample pages (one datapoint fires) | Flapping; the pager becomes noise | Sustained thresholds / multi-window burn rates |
| A4 | Pages without owners or runbooks | At 3 a.m. nobody knows what it means | Owner + runbook link in the alert definition |

## SLO tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| S1 | No SLOs at all | "Working" has no definition until the outage | `slo`: SLI + target + window per journey |
| S2 | SLOs on infrastructure instead of journeys | "CPU 99.9% available" while checkout is broken | The user journey is the unit of truth |
| S3 | 100% targets | Unachievable, unspendable, uninformative | 99.9% with an error budget that gets *used* |
| S4 | Error budgets nobody looks at | The decision the budget exists to make isn't made | Weekly burn review; feature-vs-reliability calls |

## Dashboard tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| D1 | Cargo-cult dashboards (everyone copies the template) | Panels answer the template's questions, not yours | Each panel states its question (`dashboard`) |
| D2 | Orphaned panels and dashboards | Decoration with a maintenance cost | Delete; dashboards are answers, not wallpaper |
| D3 | The wall of numbers (no journey, no hierarchy) | Nobody knows where to look first | Journey-first layout: golden signals per journey |

## Detector mapping

`scripts/check.mjs` deterministically catches: L1-ish (log-in-loop), L3 (generic error strings),
L4 (string-concat logs), M1 (mean-only metrics), M2 (metric-name scatter ≥3), A4 (alerts without
owner/runbook), T1 (outgoing calls without correlation-ID propagation in handler files), the
secrets/PII-in-logs pair, sync-log-on-hot-path, and the project-level no-SLO finding. The rest are
LLM-judged — keep this file loaded when auditing or reviewing.
