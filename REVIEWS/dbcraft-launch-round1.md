# Review: dbcraft launch artifacts — Round 1

**Panel:** Schema-Diff Expert · Migration-Tooling Engineer · Engine Specialist ·
QA Evasion Engineer · Launch/Growth Reviewer.

## Schema-Diff Expert — schema-diff.mjs

| # | Sev | Finding |
|---|---|---|
| C1 | **Major** | **In-table `CREATE UNIQUE INDEX` is invisible.** Only standalone index statements are extracted; Postgres's `CREATE UNIQUE INDEX ... ON t` is standalone (covered), but the extractor silently skips `UNIQUE` **constraints on columns** that are the soft-delete case's backbone — actually covered via `col.unique`… the real gap: **`removed-index` fires on indexes whose columns were dropped too** (double-reporting: dropped-column + removed-index for the same change). One finding per change — suppress removed-index when all its columns were themselves dropped. |
| C2 | **Minor** | **Constraint-name changes** (renamed CHECK) report as removed+added — visible, but the message should say "removed/added pair — treat as rename" like the rename-pair guidance already does. Add the wording. |
| C3 | **Pass** | Flow/block forms, paren-aware parsing, additive-clean, deprecated semantics ported from apicraft's lessons — strong. |

## Migration-Tooling Engineer — migration-review daemon

| # | Sev | Finding |
|---|---|---|
| L1 | **Minor** | `up`/`down` SQL is rendered in `<pre>` **unescaped from the file's perspective** — it IS escaped (esc() applied), verified. The real gap: no **`--timeout` documentation** parity with the other daemons (it has it in code, missing from migrate-review.md). One line. |
| L2 | **Pass** | All-verdicts-required, n/a verdict from the start, protocol parity with apicraft's daemon. |

## Engine Specialist — engine sheets

| # | Sev | Finding |
|---|---|---|
| E1 | **Minor** | MySQL sheet's FK-on-InnoDB trap and SQLite's pragma-off trap are the standout content — but the **sheets aren't referenced from `migrate`/`modernize`** (the same G1-class finding from codecraft's round). Wire one line each. |
| E2 | **Pass** | Content is current: identity columns, RLS, utf8mb4 vs utf8, STRICT tables, WAL, rebuild-migrations. |

## QA Evasion Engineer — behavioral evals

| # | Sev | Finding |
|---|---|---|
| Q1 | **Minor** | No scenario pins the **merge-pass behavior** (documented-null comment after a comma-split column) — the exact bug the demo caught. Pin it. |
| Q2 | **Pass** | 30 scenarios incl. windowed DELETE, comment stripping, schema-diff matrix, daemon protocol. |

## Launch/Growth Reviewer — docs, demo, case study

| # | Sev | Finding |
|---|---|---|
| R1 | **Minor** | The case study's "3 errors / 10 warnings" claims `update-without-where (in the demo's sibling query set)` — that's in the *before.sql*? No: the demo's before.sql has no UPDATE. The case study's parenthetical is wrong — fix it to the real findings. |
| R2 | **Pass** | Demo runner shows both migration paths; docs links resolve; README updated. |

## Verdict (Round 1)

Accept C1, C2, L1, E1, Q1, R1. Reject none.
