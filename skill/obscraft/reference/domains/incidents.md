# Domain: Incidents

Incident readiness is where observability proves itself: the 3 a.m. test, run before the 3 a.m.
incident. The telemetry exists so a tired human can find the cause — this domain makes that
sentence true.

## The 3 a.m. test (`signal-floor.md` Reflexes)

Take the last real incident (or the most likely one) and walk it from the page: alert fires →
dashboard shows which journey and how far over SLO → exemplar trace names the failing hop → log
line with the same ID shows the error → runbook tells the human the action. **Every step that
required opening the code is a gap** — and each gap is a ticket (`respond`).

## The incident loop

1. **Detect** — the page fires (actionable per `alerts.md`).
2. **Orient** — the dashboard answers "what's broken, how badly, since when" in the first 30
   seconds.
3. **Attribute** — the trace + logs name the failing dependency or deploy; the deploy's diff is
   linked (the most common cause is the last change).
4. **Mitigate** — the runbook's action; the kill-switch/rollback path exists and is tested
   (`seccraft`'s respond agrees).
5. **Recover & learn** — postmortem with the SLO burn as the measure of harm; every incident
   rewrites a runbook and closes a telemetry gap.

## The readiness artifacts (`respond` produces these)

- **Runbooks per incident class** — detect → orient → attribute → mitigate → recover, with the
  real commands and the real names.
- **The on-call path** — who gets paged, the escalation chain, the comms templates.
- **The dry-run** — the top incident class is exercised end-to-end (including the alert firing
  on a synthetic fault). A runbook that has never been walked is a document
  (`seccraft`'s respond agrees).
- **The postmortem habit** — blameless, budget-measured, and the actions tracked to closure.

## Telemetry's role in the incident

- The telemetry store itself must survive the incident: it's on separate infrastructure from what
  it observes, or the outage takes the evidence with it (`telemetry.md`).
- Retention covers the investigation window; the trace sample kept the failing requests
  (`traces.md`'s error over-sampling is what makes postmortems possible).

## Bans (recap)

Untested runbooks, code-openings in the incident path, telemetry that dies with the service,
postmortems without budget math, gaps found at 3 a.m. instead of in the dry-run.
