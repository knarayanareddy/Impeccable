# Command: audit

Defect scan: log hygiene, metric quality, alert actionability, and the 3 a.m. gaps. Finds and
ranks — it does not fix. No code or config edits.

## Steps

1. Run `scripts/check.mjs --target <path>` for the deterministic set (secrets/PII in logs,
   generic error messages, log-in-loop, string-concat logs, mean-only metrics, metric-name
   scatter, alerts without owner/runbook, missing correlation-ID propagation, no SLO definitions).
2. Inspect what the checker can't see:
   - **Logs** (`domains/logs.md`): level contract followed? warn+ structured? expected business
     outcomes not logged as ERROR?
   - **Metrics** (`domains/metrics.md`): percentiles present, labels bounded, orphans (metrics no
     dashboard/alert queries)?
   - **Traces** (`domains/traces.md`): spans at the boundaries, propagation through every hop,
     sampling strategy written?
   - **Alerts** (`domains/alerts.md`): the actionability contract per alert — condition, action,
     runbook link, owner; single-sample pages; fatigue signals (page volume per shift).
   - **Dashboards** (`domains/dashboards.md`): panels with questions; orphans.
   - **SLOs** (`domains/slos.md`): journeys with SLIs/targets/owners; error-budget reviews.
3. Walk the last incident through the telemetry (the 3 a.m. test) and list every step that
   needed the code (`domains/incidents.md`).
4. Output a ranked punch list: severity (Blocker / Major / Minor / Nit), file:line or
   alert/dashboard name, rule, and the fix. Blockers = signal-floor violations. Sort by severity,
   then by 3 a.m. impact.

## Rules

- Cite the exact line/alert/panel for every finding — never vague impressions.
- Audit does not edit. The fix is a follow-up command (`log`, `metric`, `correlate`, `alert`,
   `slo`...).
- End with a one-line verdict and counts per severity.
