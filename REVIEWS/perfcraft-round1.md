# Review: perfcraft (performance) — Round 1

**Panel:** Reference Keeper (pbakaus/impeccable expert) · Domain Principal (performance engineer) ·
Skill Author (Agent Skills spec craft) · Practitioner (daily user)

## Reference Keeper — pattern fidelity vs the reference repo

| # | Sev | Finding |
|---|---|---|
| R1-1 | **Minor** | No `pin` shortcuts note (suite-wide convention — add). |
| R1-2 | **Minor** | No hooks wiring step (suite-wide convention — add). |
| R1-3 | **Major** | `budget` describes budgets-as-code but **ships no example budget file** — first runs improvise the format. Add `assets/budget.example.json` (lighthouse-style) + reference from budget.md. |
| R1-4 | **Pass** | Measurement-first doctrine, bounded optimize loop, profile-first attribution — the strongest doctrine in the suite; above reference parity for a code facet. |
| R1-5 | **Pass** | Checker covers accidental-slop tells; no overlap gap with Vercel's React-specific skill (perfcraft is cross-stack). |

## Domain Principal — industry best practices

| # | Sev | Finding |
|---|---|---|
| D1-1 | **Minor** | web.md lacks the **LCP sub-part attribution** (TTFB / resource load delay / render delay) — the current standard for acting on LCP. Add. |
| D1-2 | **Pass** | Percentiles-not-averages, flame-graph attribution, budgets-in-CI, tail-aware alerting — all current. |

## Skill Author — spec & authoring craft

| # | Sev | Finding |
|---|---|---|
| A1-1 | **Minor** | Detector mapping uses phrases not rule ids — align (suite convention). |
| A1-2 | **Minor** | `no-budget-gate` fires on single-file targeted scans — same scope fix as apicraft's no-spec-file. |
| A1-3 | **Pass** | Frontmatter spec-clean; N+1 lookback windows and image-size rules are authoring-quality signals. |

## Practitioner — daily use

| # | Sev | Finding |
|---|---|---|
| P1-1 | **Major** | `init` writes PERF.md with no template — add `assets/PERF.example.md`. |
| P1-2 | **Pass** | `/perfcraft profile src/checkout` reads like a product. |

## Verdict (Round 1)

Accept R1-1, R1-2, R1-3, D1-1, A1-1, A1-2, P1-1. Reject none.
