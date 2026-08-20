# Review: obscraft launch artifacts — Round 1

**Panel:** Telemetry-Shape Expert · SLO/Alert Tooling Engineer · Pillar Specialist ·
QA Evasion Engineer · Launch/Growth Reviewer.

## Telemetry-Shape Expert — telemetry-check.mjs

| # | Sev | Finding |
|---|---|---|
| T1 | **Minor** | The metric `type` is required but **not validated against the vocabulary** — `"type": "guage"` (typo) passes. Validate against counter/gauge/histogram/summary. |
| T2 | **Minor** | The accepted file shapes aren't documented in telemetry-check.md — the container-block (`slo:`), list (`alerts:`), and `entries`-wrapped JSON forms should be stated so adapter authors don't guess. |
| T3 | **Pass** | The zero-entry refusal, the 100%-target rule, and the quartet/actionability checks are correct; the phantom-block fix during the build was the right call. |

## SLO/Alert Tooling Engineer — slo-review daemon

| # | Sev | Finding |
|---|---|---|
| A1 | **Minor** | No daemon protocol doc (the recurring class: `--timeout`, trusted-network note, last-choice-wins). Add `slo-review.md`. |
| A2 | **Pass** | Gap callouts in red, approve/flag/n-a, partial-submit rejection, the EADDRINUSE clean-exit fix — protocol-correct. |

## Pillar Specialist — pillar sheets

| # | Sev | Finding |
|---|---|---|
| P1 | **Pass** | The sheets are the *how* (instruments → workflow → bans) and are wired into Setup + log/metric/trace. Current: pino/zap child loggers, bucket tails, traceparent propagation. No changes. |

## QA Evasion Engineer — behavioral evals

| # | Sev | Finding |
|---|---|---|
| Q1 | **Minor** | No scenario pins the metric-type validation (once T1 lands). Add it. |
| Q2 | **Pass** | 20 scenarios; the harness already caught the stale-daemon port collision and drove the family-wide EADDRINUSE fix — the mechanism is working. |

## Launch/Growth Reviewer — docs, demo, case study

| # | Sev | Finding |
|---|---|---|
| R1 | **Pass** | Case study numbers match the real runs; docs resolve; README updated. |

## Verdict (Round 1)

Accept T1, T2, A1, Q1. Reject none.
