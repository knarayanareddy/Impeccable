# Domain: Alerts

Alerts are the observability system's one *interrupting* output — every page stops a human. The
craft: each page earns its interruption by being actionable, and the system's total page volume is
a budget, not an accident.

## The actionability contract (non-negotiable)

Every alert definition states, in the alert itself:
1. **The condition** — the exact signal and threshold (burn rate, sustained error rate, queue
   depth).
2. **The action** — what the paged human *does*: the first diagnostic, the mitigation, the
   escalation ("check the payment provider's status; fail over to provider B; page the on-call
   lead if > 15 min").
3. **The runbook** — a link, not a promise.
4. **The owner** — who answers for this alert's existence.

An alert where the action is "look at the dashboard and hope" is noise — delete it, don't tune it
(`anti-patterns.md` A1, `signal-floor.md` #2).

## Burn-rate alerting (the modern shape)

- **Multi-window burn rates** (`slo`'s enforcement): fast burn (e.g., 2% of budget in 1h) pages
  quickly; slow burn (5% in 6h) tickets. Together they catch real incidents without flapping.
- **Never single-sample pages** (`anti-patterns.md` A3): one bad datapoint is not a page.
  Sustained thresholds with durations, or burn rates over windows.
- **Alert on symptoms, not causes**: "checkout is failing" (symptom) pages; "disk full" (cause)
  tickets — symptom alerts catch unknown causes; cause alerts miss unknown symptoms.

## The fatigue budget

- **Total pages per on-call shift is a designed number.** If a shift averages more pages than a
  human can genuinely triage, the system is broken — kill pages until the count is sane
  (`signal-floor.md` Reflexes).
- **Every page gets a retrospective line**: was the human action possible? was it right? Pages
  that fail this test get deleted or rewritten — the alerting system learns.
- **Severity is real**: P1 pages (human, now), P2 tickets (human, soon), P3 logs (no human).
  Everything paging is nothing paging.

## Hygiene

- **Alerts are versioned and reviewed** like code (alerts-as-code in the repo, diffs in PRs) —
  a hand-edited dashboard alert is an unowned alert.
- **Silences expire** — a silenced alert with no expiry is a deleted alert wearing a mask.
- **Runbooks live with the alert** and get dry-run yearly (`respond`).

## Bans (recap)

Unowned pages, action-less pages, single-sample alerts, cause-only alerting, unlimited page
volume, silent silences, alert definitions outside version control.
