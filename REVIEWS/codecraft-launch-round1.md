# Review: codecraft launch artifacts — Round 1

**Panel:** Hook-Integration Engineer · Live-Tooling Engineer · Language Specialist ·
QA Evasion Engineer · Launch/Growth Reviewer.

## Hook-Integration Engineer — hooks.mjs

| # | Sev | Finding |
|---|---|---|
| H1 | **Major** | `on --apply` **overwrites** `.claude/settings.json` wholesale — a pre-existing settings file with the team's own hooks survives only if the JSON parses cleanly; a malformed or hand-edited file would be clobbered. The merge must refuse to write when the existing JSON is unparseable (loud error, not silent overwrite). |
| H2 | **Minor** | The hook command hardcodes `<path>` — the agent must substitute it manually. Fine for a human, but document the substitution in hooks.md's usage. |
| H3 | **Pass** | Dry-run default, `|| true` doctrine, status as the audit tool — correct. |

## Live-Tooling Engineer — live.mjs

| # | Sev | Finding |
|---|---|---|
| L1 | **Minor** | Protocol parity with criterion's daemon is good; document the per-skill-copy rationale (standalone installs) in live.md — currently implied only in the source header. |
| L2 | **Pass** | Serve/beat/choose/--wait/--result verified by scenario; last-choice-wins semantics match criterion's. |

## Language Specialist — idiom sheets

| # | Sev | Finding |
|---|---|---|
| G1 | **Major** | The four sheets are loaded "alongside" the idioms domain but nothing in the **commands** references them — `modernize`, `align`, `review`, and `audit` should mention the sheet as their language authority, or the routing note is dead text. Wire one line into modernize.md + align.md. |
| G2 | **Pass** | Sheet content is current: discriminated unions over TS enums, `errors.Is/As`, anyhow/thiserror split, `// SAFETY` contracts, cause-chained re-raises — correct and opinionated where it should be. |

## QA Evasion Engineer — behavioral evals

| # | Sev | Finding |
|---|---|---|
| Q1 | **Major** | The comment-stripping scenarios pin the behavior, but the **criterion checker has the same commented-out-code narrowness** codecraft just fixed — cross-skill drift: the same anti-pattern class now behaves differently in two skills. Fix criterion's rule too (its own scenario suite keeps it pinned), or record the divergence as deliberate. |
| Q2 | **Pass** | 24 scenarios, severity semantics, windowed detection, hooks + live protocols, TDZ fixed, exit-code catches — the harness quality improved measurably from criterion's pass. |

## Launch/Growth Reviewer — docs, demo, case study

| # | Sev | Finding |
|---|---|---|
| R1 | **Minor** | `demos/codecraft/before.js` has a header comment containing the word "TODO" — it inflates the demo's todo-sprawl count (6 markers for 5 real TODOs). Rename the prose word in the header. |
| R2 | **Pass** | Case study numbers match the real run; docs links carry `.md` suffixes from the start; license footer present. |

## Verdict (Round 1)

Accept H1, H2, L1, G1, Q1, R1. Reject none.
