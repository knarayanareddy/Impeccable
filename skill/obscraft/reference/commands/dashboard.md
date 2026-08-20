# Command: dashboard

Dashboards that answer questions (`domains/dashboards.md` is the authority). The pass that turns
wallpaper into an answer sheet — and deletes what answers nothing.

## Steps

1. Audit the dashboards: which get opened (usage), which panels state a question, which are
   orphans, where the incident path breaks.
2. Rebuild per the layout:
   - **Journey-first rows**: one row per critical journey — golden signals (latency percentiles,
     traffic, error rate, saturation) + the SLO burn panel (`dashboard.md`).
   - **The incident order**: "is anything broken?" → "which journey?" → "why?" — the first panel
     is the overall health, the last is the exemplar trace.
   - **Every panel titles its question** ("Is checkout P95 within the 3s SLO?") and links out
     (runbook, exemplar) (`anti-patterns.md` D1).
   - **Percentiles and units in titles**; no mean-only panels (`metrics.md`).
3. Delete the orphans and the cargo-cult leftovers (`anti-patterns.md` D2) — with the count in
   the report.
4. Version the dashboards as code where the platform allows; record the question list in
   OBSERVABILITY.md.
5. Verify: the incident walk (page → dashboard → trace → log) works from the new layout; a
   synthetic failure shows in the right row within the refresh window.

## Exit criteria

- One question per panel, journey-first layout, orphans deleted, dashboards versioned, the
  incident walk verified.

## Rules

- Deletion is the discipline: a panel that answers no question is removed, not kept "just in
  case".
- Dashboards are for the on-call human, not the demo — optimize for the 3 a.m. read, not the
  screenshot.
