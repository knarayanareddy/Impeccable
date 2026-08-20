# Review: testcraft (testing) — Round 1

**Panel:** Reference Keeper (pbakaus/impeccable + anthropics webapp-testing expert) · Domain
Principal (QA lead) · Skill Author (Agent Skills spec craft) · Practitioner (daily user)

## Reference Keeper — pattern fidelity

| # | Sev | Finding |
|---|---|---|
| R1-1 | **Minor** | No `pin` shortcuts note (suite-wide convention — add). |
| R1-2 | **Minor** | No hooks wiring step (suite-wide convention — add). |
| R1-3 | **Pass** | vs anthropics/webapp-testing (Playwright): testcraft is the *judgment* complement — no overlap gap. Flaky taxonomy + determinism domain exceed available references. |
| R1-4 | **Pass** | Commands/domains/floor/bounded verification faithful; suite-floor is the strongest floor in the suite. |

## Domain Principal — industry best practices

| # | Sev | Finding |
|---|---|---|
| D1-1 | **Major** | **Property-based testing absent** (Hypothesis, fast-check) — the standard cure for boundary blindness. Add to cases.md + harden.md. |
| D1-2 | **Minor** | **Characterization tests (golden master) for legacy code absent** — the only honest way to test a legacy system before refactoring. Add to cases.md. |
| D1-3 | **Minor** | Integration domain says "containers/local services" — name **Testcontainers** explicitly, it's the industry default. |
| D1-4 | **Pass** | Pyramid-as-latency-budget, mutation testing, determinism taxonomy, AHA-aware fakes — current. |

## Skill Author — spec & authoring craft

| # | Sev | Finding |
|---|---|---|
| A1-1 | **Minor** | `network-in-test` fires on all test files — but integration/E2E tests *honestly* hit local services. Exempt files whose path declares the level (integration/e2e/api dirs). |
| A1-2 | **Minor** | Detector mapping uses anti-pattern IDs — align to rule ids (suite convention). |
| A1-3 | **Pass** | Frontmatter spec-clean; test-file auto-detection is above reference parity. |

## Practitioner — daily use

| # | Sev | Finding |
|---|---|---|
| P1-1 | **Major** | `init` writes TESTS.md with no template — add `assets/TESTS.example.md`. |
| P1-2 | **Pass** | `flaky`/`strengthen`/`prune` read like a product. |

## Verdict (Round 1)

Accept R1-1, R1-2, D1-1, D1-2, D1-3, A1-1, A1-2, P1-1. Reject none.
