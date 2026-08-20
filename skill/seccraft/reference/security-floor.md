# Security floor

Load this file **immediately before editing any security-relevant code or config**. It is the
non-negotiable floor, the absolute bans, and the reflexes no detector catches. When the team's
published security policy is stricter, theirs wins.

## The floor

1. **Every input is untrusted until proven otherwise.** User input, upstream APIs, files, headers,
   cookies, environment — all cross the trust boundary and get validated at the edge
   (`domains/injection.md`). An unvalidated input reaching a sink is a defect.
2. **Every resource access is authorized — object-level.** Authentication proves identity;
   authorization proves access to *this* object. Every read/write of a resource checks the caller's
   right to that specific resource (IDOR/BOLA is the #1 exploited class) (`domains/authz.md`).
3. **Default-deny everywhere.** Unmatched routes deny, unknown inputs reject, unlisted permissions
   refuse. The failure path is closed; opening requires an explicit decision.
4. **Failures leak nothing useful.** Error responses carry codes, not stack traces, internals,
   versions, or query shapes. Log the detail server-side; return the minimum (`domains/trust.md`).
5. **Secrets never touch code or config.** Secrets live in a manager (vault/secret store) with
   rotation, scoping, and audit; never in source, git, CI logs, or env-var dumps
   (`domains/secrets.md`). A committed secret is rotated, not ignored.
6. **Cryptography is current and standard.** TLS ≥1.2 (1.3 preferred); AES-GCM/chacha20-poly1305
   for encryption; argon2/bcrypt/scrypt for passwords; SHA-256+ for integrity; CSPRNG for anything
   a token derives from. MD5/SHA1-for-security, ECB, hardcoded IVs, and `alg: none` are broken
   (`domains/crypto.md`).
7. **Tokens and sessions are locked down.** Short lifetimes, explicit expiry, revocation paths,
   secure+httpOnly+SameSite cookies, no tokens in URLs or logs (`domains/authn.md`).
8. **Dependencies are known and current.** Lockfiles pinned, vulnerabilities audited in CI,
   upgrades scheduled. A known-vulnerable dependency is a known breach with a CVE number
   (`depend`).
9. **Security logging exists and says the truth.** Authentication events, authz denials, input
   validation failures, and admin actions are logged with context — and the logs can't be
   injected (`domains/abuse.md`, `monitor`).
10. **The threat model is written, not assumed.** Trust boundaries and the threats they face are
    documented per component (SECURITY.md / threat-model notes) and revisited on architecture
    change (`threatmodel`).

## Absolute bans (deterministic — most are caught by `scripts/check.mjs`)

- Hardcoded credentials in code (API keys, passwords, tokens) — even in comments
- String-built SQL from inputs (SQL injection)
- `eval` / `new Function` / `document.write` with dynamic input
- `innerHTML`/`dangerouslySetInnerHTML` with unescaped user data
- Shell commands built by string concatenation with input
- `Math.random()` for tokens, IDs, or anything security-relevant (use CSPRNG)
- MD5/SHA-1 for passwords or security hashing
- JWTs with `alg: none` or hardcoded secrets
- Private keys committed to the repo (`BEGIN ... PRIVATE KEY`)
- Cookies with `secure: false` / `httpOnly: false` in production config
- CORS `*` combined with credentials, or `*` on authenticated APIs
- Auth disabled on a route "for now" (`AllowAnonymous`/`permitAll`/`no_auth` without a review note)
- Plain HTTP URLs for anything security-relevant
- Debug mode / stack traces enabled in production config

## Reflexes (no detector catches these)

- **The attacker uses defaults.** Every "default" is a choice: default passwords, default ports,
  demo keys, sample data. Ship nothing with its factory settings.
- **Authentication is not authorization.** After every authn check, ask: does this caller have
  rights to *this* object? The two questions are separate lines of code and separate lines of
  review.
- **The error message is an oracle.** What does this error tell an attacker? Field existence,
  timing, enumeration — design responses to reveal the minimum.
- **Convenience is the attack surface.** "We'll skip MFA for now", "the API is internal so no
  auth", "this endpoint is only called by us" — each is a breach waiting for a misconfigured
  proxy.
- **Data minimized is data protected.** Don't collect, store, log, or return what the job doesn't
  need. The field you don't have is the field that can't leak.
- **Security is reviewed, not remembered.** Every authz change, cookie change, and crypto change
  gets an explicit review line — security diffs are the diffs that matter most.
- **The breach question.** For any component: if this were breached tonight, what would the blast
  radius be? If the answer is "everything", the design is wrong — compartmentalize.
