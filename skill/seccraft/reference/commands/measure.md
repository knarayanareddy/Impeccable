# Command: measure

The quantitative pass. Numbers, not adjectives. Complements `review` (judgment), `audit`
(defects), and `threatmodel` (design). No edits.

## What gets measured

1. **Secrets posture** — hardcoded credentials found (checker), secrets in git history
   (scan), secret-scan coverage in CI, rotation coverage (secrets with a rotation path).
2. **Authz coverage** — resource-touching routes vs routes with object-level checks; the authz
   matrix tests present per resource class.
3. **Injection surface** — sinks by type (SQL/HTML/shell/URL) vs sinks with the matching
   defense; CSP presence and strictness.
4. **Crypto inventory** — hashing/encryption call sites vs the current-constructions list;
   broken-list hits (checker).
5. **Config posture** — security headers present per surface (count), CORS policy strictness,
   debug-off in prod config, cookie flags on auth cookies.
6. **Dependency hygiene** — known vulnerabilities by severity (audit tool), days since last
   audit, unpinned vs pinned manifests.
7. **Abuse controls** — auth/expensive endpoints with rate limits (%); lockout policies; 429
   with Retry-After coverage.
8. **Response readiness** — security events logged (authn, authz denials, admin actions);
   runbook existence per incident class.

## Output

A measurement report: per-metric table with numbers, the floor comparison against
`security-floor.md`, then the ranked delta list — cheapest change to highest risk reduction.

## Rules

- Every number cites its method (checker / scanner / inspection). If a metric can't be measured
  with available tooling, report "not measured" — never guess.
- Quote before/after numbers around any subsequent hardening — that's how security craft
  becomes visible.
