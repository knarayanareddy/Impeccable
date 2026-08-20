# Review: apicraft (API design) — Round 1

**Panel:** Reference Keeper (pbakaus/impeccable expert) · Domain Principal (API architect) ·
Skill Author (Agent Skills spec craft) · Practitioner (daily user)

## Reference Keeper — pattern fidelity vs the reference repo

| # | Sev | Finding |
|---|---|---|
| R1-1 | **Minor** | No `pin` shortcuts note — add (suite-wide convention). |
| R1-2 | **Minor** | No hooks wiring step — add (suite-wide convention). |
| R1-3 | **Major** | The reference pairs its skill with a **detector**; apicraft's checker detects code tells but never validates the *spec artifact itself*. Add spec-lint rules to check.mjs: endpoints missing responses, missing operationIds, responses lacking description/content, errors not declared. |
| R1-4 | **Pass** | Commands, domains, floor, bounded verification faithful; the consumer-code test is a genuine differentiator the reference lacks. |
| R1-5 | **Pass** | SDK/doc generation from spec already owned by `specs.md`/`document`. |

## Domain Principal — industry best practices

| # | Sev | Finding |
|---|---|---|
| D1-1 | **Minor** | Error envelope should reference **RFC 9457 (Problem Details)** — the industry-standard `application/problem+json` shape. Align, don't invent. |
| D1-2 | **Pass** | Deprecation/Sunset headers, idempotency keys, cursor pagination, expand/contract versioning — all current best practice. |
| D1-3 | **Pass** | Contract-first + CI spec-diff is the strongest position in the category. |

## Skill Author — spec & authoring craft

| # | Sev | Finding |
|---|---|---|
| A1-1 | **Minor** | `no-spec-file` fires even on single-file targeted scans — a false positive for focused work. Emit only when scanning a project scope (directory/multiple files). |
| A1-2 | **Minor** | Detector-mapping wording ("E1-ish") should name actual rule ids — align (suite-wide convention). |
| A1-3 | **Pass** | Frontmatter spec-clean; progressive disclosure holds. |

## Practitioner — daily use

| # | Sev | Finding |
|---|---|---|
| P1-1 | **Major** | `init` writes API.md with **no template** — add `assets/API.example.md`. |
| P1-2 | **Minor** | `contract` would benefit from a shipped minimal OpenAPI skeleton — add `assets/openapi.example.yaml`. |

## Verdict (Round 1)

Accept R1-1, R1-2, R1-3, D1-1, A1-1, A1-2, P1-1, P1-2. Reject none.
