# Review: perfcraft (performance) — Round 2

**Panel:** Reference Keeper (verification) · Second Domain Principal (web performance
specialist) · Adversary (checker red-team) · Practitioner (re-check)

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| R1-1/R1-2 shortcuts + hooks | ✅ | Both added |
| R1-3 budget example | ✅ | assets/budget.example.json (resource sizes/counts + percentile-stated metric budgets) referenced from budget.md |
| D1-1 LCP sub-parts | ✅ | web.md: TTFB / load delay / load duration / render delay with fix-per-part |
| A1-1 mapping ids | ✅ | Rule ids named |
| P1-1 PERF template | ✅ | assets/PERF.example.md shipped |

## Fresh-eyes findings (Second Domain Principal — web performance specialist)

| # | Sev | Finding |
|---|---|---|
| F2-1 | **Minor** | web.md's long-task guidance should name **`scheduler.yield()`** — the current platform API for breaking long tasks cooperatively. One line. |

## Adversary (checker red-team)

| # | Sev | Finding |
|---|---|---|
| A2-1 | **Major** | `n-plus-one` lookback window (3 lines) misses loop bodies where the query sits deeper. Extend to 5 (tradeoff documented). |
| A2-2 | **Major** | `sync-io` misses `fs.readSync`/`fs.writeSync` and `execFileSync` — same blocked-worker class. Add. |
| A2-3 | **Minor** | `string-concat-loop` misses the self-concatenation form `x = x + y` (only `+=` matched). Add. |
| A2-4 | **Minor** | `no-budget-gate` fires on single-file targeted scans — project-scope only (carried from A1-2). |
| A2-5 | **Pass** | Busy-retry, layout/DOM thrash, deep-clone, heavy-asset, img-no-lazy survive probing. |

## Practitioner re-check

| # | Sev | Finding |
|---|---|---|
| P2-1 | **Pass** | Round-1 usability concerns resolved. |

## Verdict (Round 2)

Accept F2-1, A2-1, A2-2, A2-3, A2-4. Implement all. After this pass, perfcraft is review-clean.
