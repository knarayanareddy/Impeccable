# Command: review

Security-craft review with scoring — the judgment pass `audit`'s defect scan can't do alone. The
one question: **would you ship this, knowing what attackers do with defaults?** No edits.

## Scorecard (1–5 each)

| Dimension | The question |
|---|---|
| Trust model | Are the boundaries drawn and the defaults distrustful (`trust.md`)? |
| Authentication | Passwords, sessions, tokens, MFA — current and complete (`authn.md`)? |
| Authorization | Is object-level access checked everywhere, deny-by-default (`authz.md`)? |
| Injection defense | Are all sinks parameterized/escaped, CSP in place (`injection.md`)? |
| Secrets | Managed, scoped, rotated — or written (`secrets.md`)? |
| Crypto | Current, standard constructions; nothing on the broken list (`crypto.md`)? |
| Data posture | Classified, minimized, retained per policy (`data.md`)? |
| Abuse readiness | Rate limits, lockouts, and degradation under attack (`abuse.md`)? |
| Dependency hygiene | Pinned, audited, updatable (`depend`)? |
| Response posture | Logs say the truth; the runbook exists (`monitor`, `respond`)? |

## Steps

1. Read the target as an attacker would: what's exposed, what's default, what error says too
   much, what route is "internal"?
2. Score each dimension with one "what's holding" and one "what's not" line, citing the exact
   mechanism or absence — "no object-level check on /orders/{id}" is a citation.
3. Deliver: the scorecard, the three highest-leverage fixes (ranked by exploitability × blast
   radius), one honest strength, and one "bold move" — the single change that would most raise
   the system's security posture.

## Rules

- Review the system, not the team's intentions: "we'll harden it later" scores as "open now".
- Authentication-without-authorization, a committed secret, and a demo default in prod are each
  full findings, not dimension nits.
- No edits in review; follow-up commands (`authz`, `sanitize`, `secrets`, `lock`, `harden`...)
  pick up the ranked list.
