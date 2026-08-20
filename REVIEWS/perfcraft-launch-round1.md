# Review: perfcraft launch artifacts — Round 1

**Panel:** Budget/Gate Expert · Live-Tooling Engineer · Measurement Specialist ·
QA Evasion Engineer · Launch/Growth Reviewer.

## Budget/Gate Expert — budget-check.mjs

| # | Sev | Finding |
|---|---|---|
| B1 | **Major** | **Unmeasured = silent pass.** Entries with no measurement are skipped — so a measurements file missing `resourceCounts` entirely reports "within budget ✓" for the count budgets. The gate must say *what it did not measure*: list the unmeasured budget entries in the output (and in `--json`), and fail the shape when **nothing** was measurable against a non-empty budget. |
| B2 | **Minor** | `budgetMs` vs `budget` duality for CLS (a unitless 0.1) is handled, but the message renders "ms" only for `budgetMs` — good. The real nit: the budget example asset says CLS's budget is `0.1` — consistent. Pass. |
| B3 | **Pass** | Percentile shape rule, breach numbers, exit codes — correct. |

## Live-Tooling Engineer — optimize-review daemon

| # | Sev | Finding |
|---|---|---|
| L1 | **Pass** | Number-less options rejected at load (the floor enforced by the tool), receipts rendered, protocol parity — the strongest daemon gate in the suite. |
| L2 | **Minor** | The daemon's own `--timeout` is undocumented (the recurring finding class). One line in budget-check.md's sibling… actually the daemon has no .md — add a one-line protocol doc next to budget-check.md (a `optimize-review.md`). |

## Measurement Specialist — measurement sheets

| # | Sev | Finding |
|---|---|---|
| M1 | **Minor** | The sheets aren't referenced from **`profile`/`optimize`** — the two commands that consume instruments. One line each. |
| M2 | **Pass** | Lab/field split, tail-sampling, knee identification, EXPLAIN honesty — current and correct. |

## QA Evasion Engineer — behavioral evals

| # | Sev | Finding |
|---|---|---|
| Q1 | **Pass** | 24 scenarios incl. the bounded-retry precision guards the demo caught — the harness now pins both the rule and its exceptions. |
| Q2 | **Minor** | No scenario pins the **unmeasured-entry behavior** (B1's class) — add once the fix lands. |

## Launch/Growth Reviewer — docs, demo, case study

| # | Sev | Finding |
|---|---|---|
| R1 | **Pass** | Case study tells the honest story (the demo caught the author's own checker gaps — fixed and pinned). Docs resolve, README updated. |

## Verdict (Round 1)

Accept B1, L2, M1, Q2. Reject none.
