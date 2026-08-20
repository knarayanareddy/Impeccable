# Review: seccraft (security) — Round 1

**Panel:** Reference Keeper (pbakaus/impeccable + trail-of-bits expert) · Domain Principal
(appsec lead) · Skill Author (Agent Skills spec craft) · Practitioner (daily user)

## Reference Keeper — pattern fidelity

| # | Sev | Finding |
|---|---|---|
| R1-1 | **Minor** | No `pin` shortcuts note (suite-wide convention — add). |
| R1-2 | **Minor** | No hooks wiring step (suite-wide convention — add). |
| R1-3 | **Major** | `threatmodel` produces "the model" but **ships no template artifact** — add `assets/threat-model.example.md`. |
| R1-4 | **Pass** | vs trail-of-bits (tool-driven): seccraft owns the *judgment* layer — trust modeling, authn-vs-authz, secure defaults. Complement, no gap. |

## Domain Principal — industry best practices

| # | Sev | Finding |
|---|---|---|
| D1-1 | **Major** | **CSRF defense absent** — SameSite covers most cases, but cookie-auth APIs need the explicit story (token/double-submit, Origin checks). Add to authn.md. |
| D1-2 | **Minor** | **Subresource Integrity (SRI)** absent — the standard control for third-party scripts. Add to lock.md. |
| D1-3 | **Minor** | Anti-patterns should anchor to **CWE/OWASP vocabulary** — the industry's shared reference frame. Add a mapping note. |
| D1-4 | **Pass** | Secrets lifecycle, current/broken crypto lists, IDOR matrix tests, SSRF allowlists — current. |

## Skill Author — spec & authoring craft

| # | Sev | Finding |
|---|---|---|
| A1-1 | **Minor** | Detector mapping uses anti-pattern IDs — align to rule ids (suite convention). |
| A1-2 | **Pass** | Credential redaction in checker output is the best craft detail in the suite. |

## Practitioner — daily use

| # | Sev | Finding |
|---|---|---|
| P1-1 | **Major** | `init` writes SECURITY.md with no template — add `assets/SECURITY.example.md`. |
| P1-2 | **Pass** | `/seccraft threatmodel orders` reads like a product. |

## Verdict (Round 1)

Accept R1-1, R1-2, R1-3, D1-1, D1-2, D1-3, A1-1, P1-1. Reject none.
