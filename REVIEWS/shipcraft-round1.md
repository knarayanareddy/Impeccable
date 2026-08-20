# Review: shipcraft (DevOps/CI-CD) — Round 1

**Panel:** Reference Keeper (pbakaus/impeccable expert) · Domain Principal (release engineer) ·
Skill Author (Agent Skills spec craft) · Practitioner (daily user)

## Reference Keeper — pattern fidelity

| # | Sev | Finding |
|---|---|---|
| R1-1 | **Minor** | No `pin` shortcuts note (suite-wide convention — add). |
| R1-2 | **Minor** | No hooks wiring step (suite-wide convention — add). |
| R1-3 | **Major** | `pipeline` writes workflows but **ships no canonical example** — add `assets/workflow.example.yml` (the boring shape) and reference it from pipeline.md. |
| R1-4 | **Pass** | Truth-and-boringness doctrine, rollback-as-feature, DORA measurement — the strongest delivery POV available; above reference parity (the reference doesn't cover delivery at all). |

## Domain Principal — industry best practices

| # | Sev | Finding |
|---|---|---|
| D1-1 | **Minor** | gates.md omits **branch protection** — the most basic gate of all (require PR + require CI green). One line. |
| D1-2 | **Minor** | config.md should name **12-factor** alignment explicitly — env-injection is the industry baseline vocabulary. |
| D1-3 | **Pass** | Expand/contract migration pairing, IaC reconciliation, drift detection, concurrency-safe deploys — current. |

## Skill Author — spec & authoring craft

| # | Sev | Finding |
|---|---|---|
| A1-1 | **Minor** | Detector mapping uses phrases — align to rule ids (suite convention). |
| A1-2 | **Pass** | CI-file auto-detection (workflow dirs + known filenames) is above reference parity. |

## Practitioner — daily use

| # | Sev | Finding |
|---|---|---|
| P1-1 | **Major** | `init` writes SHIP.md with no template — add `assets/SHIP.example.md`. |
| P1-2 | **Pass** | `/shipcraft rollback .` reads like a product. |

## Verdict (Round 1)

Accept R1-1, R1-2, R1-3, D1-1, D1-2, A1-1, P1-1. Reject none.
