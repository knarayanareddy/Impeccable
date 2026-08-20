# Review: dbcraft (database/schema) — Round 1

**Panel:** Reference Keeper (pbakaus/impeccable expert) · Domain Principal (DB architect) ·
Skill Author (Agent Skills spec craft) · Practitioner (daily user)

## Reference Keeper — pattern fidelity vs the reference repo

| # | Sev | Finding |
|---|---|---|
| R1-1 | **Minor** | No `pin` shortcuts note (suite-wide convention — add). |
| R1-2 | **Minor** | No hooks wiring step (suite-wide convention — add). |
| R1-3 | **Pass** | Commands, domains, floor, bounded verification faithful; the CREATE TABLE block-parsing checker is the deepest detector in the suite — above reference parity. |
| R1-4 | **Pass** | DATA.md context flow (init) matches the reference's PRODUCT.md pattern. |

## Domain Principal — industry best practices

| # | Sev | Finding |
|---|---|---|
| D1-1 | **Major** | **Row-level security (RLS) is absent.** The industry baseline for multi-tenant Postgres — and this suite's whole thesis is "rules live in the database". Add RLS to constraints.md and harden.md. |
| D1-2 | **Minor** | **Partitioning guidance absent** — the standard answer when scale demands it. Add a short subsection to indexes.md (partitioning is an index/scan-shape concern). |
| D1-3 | **Pass** | Expand/contract migrations, partial unique indexes for soft deletes, NUMERIC money, timestamptz, keyset pagination — all current best practice. |

## Skill Author — spec & authoring craft

| # | Sev | Finding |
|---|---|---|
| A1-1 | **Minor** | Detector mapping uses anti-pattern IDs (T1/C2…) instead of actual rule ids — align (suite-wide convention). |
| A1-2 | **Minor** | `delete-without-where` misses the multi-line form (`DELETE FROM t` with `WHERE` on the next line is clean; without it is a full delete). Needs a windowed check. |
| A1-3 | **Pass** | Frontmatter spec-clean; block parser quality verified during authoring. |

## Practitioner — daily use

| # | Sev | Finding |
|---|---|---|
| P1-1 | **Major** | `init` writes DATA.md with no template — add `assets/DATA.example.md`. |
| P1-2 | **Pass** | Command vocabulary (`constrain`, `migrate`, `normalize`, `denormalize`) reads like a product. |

## Verdict (Round 1)

Accept R1-1, R1-2, D1-1, D1-2, A1-1, A1-2, P1-1. Reject none.
