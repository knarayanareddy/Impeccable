# Surface sheet: API / services

Loaded with the relevant domains when the surface is an API or backend service. The
surface-native attack surface and controls; the compass domains still hold — and apicraft's
style/security guidance pairs here.

## The attack surface (API-shaped)

- **IDOR/BOLA is the #1 exploited class**: every resource access checks object-level authz
  — authn is not authz (`domains/authz.md`, apicraft's `authz` command).
- **Injection over the wire**: SQLi, command injection, SSRF, deserialization — the sink
  table (`domains/injection.md`) with the API-shaped additions: **SSRF** (allowlist scheme/
  host/port, block internal ranges, re-validate redirects) and **unsafe deserialization**
  (never deserialize untrusted input).
- **Abuse at volume**: brute force, stuffing, scraping, DoS — rate limits per identity,
  lockouts, work budgets (`domains/abuse.md`).

## The controls to wire (the API checklist)

| Control | Where |
|---|---|
| Object-level authz in ONE middleware layer, deny-by-default | `authz` |
| Bound parameters, argument arrays, allowlisted fetches | `sanitize` |
| The error envelope with stable codes, no internals (`errors.md`) | `harden` |
| Idempotency keys on mutating POSTs; webhook HMAC + replay windows | apicraft's idempotency domain |
| Rate limits with Retry-After + visible headers | `harden` |
| Secrets from the manager, scoped per environment, never logged | `secrets` |

## The API-specific traps

- **200-with-error-body** and **500-for-validation** (`apicraft`'s anti-patterns E1/E2) —
  the status code is part of the security contract.
- **Error oracles**: field existence, timing, enumeration — responses reveal the minimum
  (`domains/trust.md`'s oracle rule).
- **`alg: none` JWTs, hardcoded JWT secrets** (`anti-patterns.md` A3) — pin the algorithm,
  managed keys.
- **Auth disabled "for now"** (`anti-patterns.md` A2) — the route stays open forever.

## Bans

Authn-without-authz · SSRF-unchecked fetches · unsafe deserialization · error oracles ·
hardcoded credentials · un-ratelimited auth endpoints · internals in responses.
