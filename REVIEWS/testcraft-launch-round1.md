# Review: testcraft launch artifacts — Round 1

**Panel:** Suite-Health Tooling Expert · Flake-Tooling Engineer · Framework Specialist ·
QA Evasion Engineer · Launch/Growth Reviewer.

## Suite-Health Tooling Expert — suite-health.mjs

| # | Sev | Finding |
|---|---|---|
| H1 | **Minor** | `--json` mode **skips the history append's confirmation** but does append — fine. The real gap: the tool reports `report.files || report.testFiles` but the checker's `--json` emits both `files` (all files) and `testFiles` (test files); the fallback order prefers the wrong one. Prefer `testFiles`. |
| H2 | **Pass** | Ranked worst-files + per-rule counts + history append — the aggregate view is right; trend tracking is a genuinely new capability in the suite. |

## Flake-Tooling Engineer — flake-review daemon

| # | Sev | Finding |
|---|---|---|
| F1 | **Minor** | The verdict menu omits **"cannot reproduce locally"** — the honest state between quarantine and fix-now, and the flaky command's own first gate. Add it as a fifth verdict. |
| F2 | **Pass** | All-verdicts-required, escaping, protocol parity — consistent with the daemon family. |

## Framework Specialist — framework sheets

| # | Sev | Finding |
|---|---|---|
| S1 | **Minor** | The sheets aren't referenced from **`isolate`/`strengthen`** (the same wiring-class finding as prior facets). One line each. |
| S2 | **Pass** | Content is current: fake timers, freezegun, page.clock, route interception, data-testid contracts, CI ban lists. |

## QA Evasion Engineer — behavioral evals

| # | Sev | Finding |
|---|---|---|
| Q1 | **Minor** | The scenario harness caught its own author's `expect(1).toBe(1)` — good. But **no scenario pins the suite-health `--json` shape** or the history trend (2 records → both present). Add one. |
| Q2 | **Pass** | 19 scenarios; severities, exemptions, comment stripping, daemon protocol covered. |

## Launch/Growth Reviewer — docs, demo, case study

| # | Sev | Finding |
|---|---|---|
| R1 | **Minor** | The case study says "19 automated scenarios" in the docs page but the harness reports per-run counts — fine; the real nit: **docs/testcraft says 16 commands** — verify against the table (it is 16). Pass. The actual finding: the demo's after fixture uses `%%` in an `it.each` comment-format string ("5%% discount") — fine in JS, but note it renders as "5%" in the test name only if the format is applied — it's inside a string, so it's fine. **No finding — withdraw.** |
| R2 | **Pass** | Docs links resolve (0 broken), README updated, case-study numbers match the real run. |

## Verdict (Round 1)

Accept H1, F1, S1, Q1. Reject none. (R1 withdrawn by the reviewer.)
