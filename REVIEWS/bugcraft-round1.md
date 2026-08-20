# Review: bugcraft (debugging) — Round 1

**Panel:** Reference Keeper (pbakaus/impeccable expert) · Domain Principal (debugging expert) ·
Skill Author (Agent Skills spec craft) · Practitioner (daily user)

## Reference Keeper — pattern fidelity

| # | Sev | Finding |
|---|---|---|
| R1-1 | **Minor** | No `pin` shortcuts note (suite-wide convention — add). |
| R1-2 | **Minor** | No hooks wiring step (suite-wide convention — add). |
| R1-3 | **Pass** | The evidence ladder (observation→repro→minimal→hypothesis→verified→pin→class) is a genuinely stronger spine than any reference's debugging guidance. |
| R1-4 | **Pass** | Commands, floor, bounded verification faithful. |

## Domain Principal — industry best practices

| # | Sev | Finding |
|---|---|---|
| D1-1 | **Minor** | Tooling domain lacks **record/replay time-travel debugging** (rr, WinDbg TTD, browser replay) — the current standard cure for heisenbugs. Add. |
| D1-2 | **Pass** | Repro-first, bisection, minimal repro, regression pins, blameless postmortems — current. |

## Skill Author — spec & authoring craft

| # | Sev | Finding |
|---|---|---|
| A1-1 | **Minor** | Detector mapping uses anti-pattern IDs — align to rule ids (suite convention). |
| A1-2 | **Pass** | Windowed Python/JS catch detection is the deepest evidence-destruction detector in the suite. |

## Practitioner — daily use

| # | Sev | Finding |
|---|---|---|
| P1-1 | **Major** | `init` writes DEBUG.md with no template — add `assets/DEBUG.example.md`. |
| P1-2 | **Pass** | `/bugcraft repro payment-zero` reads like a product. |

## Verdict (Round 1)

Accept R1-1, R1-2, D1-1, A1-1, P1-1. Reject none.
