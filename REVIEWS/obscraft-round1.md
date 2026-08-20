# Review: obscraft (observability) — Round 1

**Panel:** Reference Keeper (pbakaus/impeccable expert) · Domain Principal (SRE lead) ·
Skill Author (Agent Skills spec craft) · Practitioner (daily user)

## Reference Keeper — pattern fidelity

| # | Sev | Finding |
|---|---|---|
| R1-1 | **Minor** | No `pin` shortcuts note (suite-wide convention — add). |
| R1-2 | **Minor** | No hooks wiring step (suite-wide convention — add). |
| R1-3 | **Major** | No **OpenTelemetry semantic conventions** — the industry's shared vocabulary for metric/trace naming (`http.server.request.duration`, `service.name`, span naming). A vocabulary skill that ignores the ecosystem's vocabulary is a miss. Add to metrics.md + instrument.md. |
| R1-4 | **Pass** | Question-first doctrine, SLO-as-product, 3 a.m. test — the strongest philosophical spine in the suite. |

## Domain Principal — industry best practices

| # | Sev | Finding |
|---|---|---|
| D1-1 | **Pass** | Multi-window burn rates, exemplars, error budgets as currency, RUM+lab both — current. |
| D1-2 | **Pass** | Privacy-aware telemetry (redaction at source, deny-lists) is ahead of most references. |

## Skill Author — spec & authoring craft

| # | Sev | Finding |
|---|---|---|
| A1-1 | **Minor** | Detector mapping uses phrases — align to rule ids (suite convention). |
| A1-2 | **Minor** | `no-slo-file` fires on single-file targeted scans — project-scope only (suite convention). |
| A1-3 | **Pass** | Frontmatter spec-clean; windowed log-in-loop and scatter aggregation are craft-grade. |

## Practitioner — daily use

| # | Sev | Finding |
|---|---|---|
| P1-1 | **Major** | `init` writes OBSERVABILITY.md with no template — add `assets/OBSERVABILITY.example.md`. |
| P1-2 | **Pass** | `/obscraft slo checkout` reads like a product. |

## Verdict (Round 1)

Accept R1-1, R1-2, R1-3, A1-1, A1-2, P1-1. Reject none.
