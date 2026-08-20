# Expert review program — index

Two-round, multi-persona expert reviews of every facet, run after the full suite shipped. Each
round is archived per skill; accepted findings were implemented and re-verified.

**Panel structure**

- Round 1: Reference Keeper (pbakaus/impeccable fidelity) · Domain Principal (facet expert) ·
  Skill Author (Agent Skills spec craft) · Practitioner (daily user)
- Round 2: Reference Keeper (verification) · Second Domain Principal (fresh sub-specialty) ·
  Adversary (checker red-team) · Practitioner (re-check)

**Archive**

| Facet | Round 1 | Round 2 | Outcome |
|---|---|---|---|
| criterion (UI/UX) | [criterion-round1.md](criterion-round1.md) | [criterion-round2.md](criterion-round2.md) | 11 findings fixed: live/document/quieter commands, templates, hooks, checker precision |
| codecraft (code) | [codecraft-round1.md](codecraft-round1.md) | [codecraft-round2.md](codecraft-round2.md) | 11 findings fixed: state domain, tunable floor, windowed catch detection |
| apicraft (API) | [apicraft-round1.md](apicraft-round1.md) | [apicraft-round2.md](apicraft-round2.md) | 10 findings fixed: spec-lint, RFC 9457, webhook signing, injection forms |
| dbcraft (database) | [dbcraft-round1.md](dbcraft-round1.md) | [dbcraft-round2.md](dbcraft-round2.md) | 10 findings fixed: RLS, partitioning, multi-line DELETE, FLOAT8, Python SQLi |
| testcraft (testing) | [testcraft-round1.md](testcraft-round1.md) | [testcraft-round2.md](testcraft-round2.md) | 11 findings fixed: property-based, characterization, tautology forms |
| perfcraft (performance) | [perfcraft-round1.md](perfcraft-round1.md) | [perfcraft-round2.md](perfcraft-round2.md) | 10 findings fixed: budget assets, LCP sub-parts, N+1 window, sync-io forms |
| seccraft (security) | [seccraft-round1.md](seccraft-round1.md) | [seccraft-round2.md](seccraft-round2.md) | 12 findings fixed: CSRF, SRI, CWE anchors, .env/JWT/SQLi/setTimeout catches |
| obscraft (observability) | [obscraft-round1.md](obscraft-round1.md) | [obscraft-round2.md](obscraft-round2.md) | 9 findings fixed: OTel conventions, token fields, Page false-positive |
| shipcraft (DevOps) | [shipcraft-round1.md](shipcraft-round1.md) | [shipcraft-round2.md](shipcraft-round2.md) | 10 findings fixed: workflow assets, branch protection, set +e, untagged images |
| bugcraft (debugging) | [bugcraft-round1.md](bugcraft-round1.md) | [bugcraft-round2.md](bugcraft-round2.md) | 7 findings fixed: record/replay, bisect run, inline uncertainty, if(0) |

**Cross-skill findings routed between reviews**

- apicraft A2-2 (Python format/%-SQL) → implemented in dbcraft + seccraft checkers (SEC-A2-2).

**Suite-wide conventions adopted from the reviews**

- Pin-shortcuts routing note + harness hooks step (docs/hooks.md) in every skill
- Detector mappings name actual rule ids in every skill
- Project-scope-only emission for project-level findings (no-spec-file, no-budget-gate,
  no-slo-file, no-ci-config)
- Asset templates (examples) shipped for every `init` context file
