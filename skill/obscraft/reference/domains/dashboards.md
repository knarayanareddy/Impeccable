# Domain: Dashboards

Dashboards are where humans meet the signals. The craft: journey-first layout, every panel a
question, and deletion as the maintenance discipline. A dashboard is an answer sheet, not a
wallpaper.

## The journey-first layout

- **One row per journey**: checkout gets its row — golden signals (latency percentiles, traffic,
  error rate, saturation) for *that* journey, plus its SLO burn panel (`slo`).
- The reader's path is the incident path: journey health → SLO burn → the worst exemplar trace →
  the log of that request (`traces.md`'s incident chain).
- **Hierarchy over walls** (`anti-patterns.md` D3): the first panel answers "is anything broken
  right now?", the second "which journey?", the third "why?" — in that order.

## The panel rules

- **Every panel states its question** in its title ("Is checkout P95 within the 3s SLO?") — a
  panel whose title is a metric name is a panel that answers nothing
  (`anti-patterns.md` D1).
- **Percentiles, not averages** (`metrics.md`); time windows stated; units in the title.
- **Panels link out**: the latency panel carries the exemplar; the error panel links the runbook.
- **Cargo-cult templates are a starting point, not a deliverable** — the template's panels that
  don't answer your questions get deleted (`anti-patterns.md` D1).

## Maintenance (deletion is the discipline)

- **Usage audit per quarter**: which dashboards get opened? Orphaned panels and dashboards are
  deleted, not kept "just in case" (`anti-patterns.md` D2) — a stale dashboard is a lie with a
  URL.
- **Versioned as code** where the platform allows (dashboard-as-code in the repo) — reviewed
  diffs, not hand-edited silos.
- **One home per question**: the same question answered on three dashboards is three answers that
  will drift (`telemetry.md`'s one-signal doctrine).

## Bans (recap)

Question-less panels, mean-only charts, orphaned dashboards, template cargo cult, unversioned
edits, questions answered thrice while others go unanswered.
