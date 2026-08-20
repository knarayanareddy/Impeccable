# Domain: Authentication

Authentication answers "who is this?" — the first question, and the one most teams stop at. The
craft: prove identity strongly, keep the proof short-lived, and remember that authn buys you
exactly nothing until authz cashes the check (`domains/authz.md`).

## Password handling (when you must store credentials)

- **Hash with argon2id** (preferred) or bcrypt/scrypt — never MD5/SHA-1/SHA-256 for passwords;
  they're fast, and fast is the enemy (`anti-patterns.md` C1).
- **Per-user salts** from the library, correct cost parameters (calibrated: ~100ms per hash),
  **constant-time comparison** (`timingSafeEqual`/`hash_equals` — `==` leaks timing
  (`anti-patterns.md` A6).
- **Never log, cache, or echo credentials.** Never allow password enumeration: identical
  responses and timing for "wrong password" and "no such user".

## Sessions and tokens

- **Session cookies:** `Secure` + `HttpOnly` + `SameSite` (Lax or Strict per the product), short
  lifetime, rotation on privilege change, revocation on logout, server-side invalidation
  (`anti-patterns.md` A5).
- **JWTs (when statelessness is truly required):** signed (RS256/ES256 with managed keys, or
  HS256 with a strong managed secret — never hardcoded), `alg` pinned, audience + issuer + expiry
  verified, short lifetimes + refresh tokens, a revocation story (denylist/short TTL). `alg:
  none` is a forged-token generator (`anti-patterns.md` A3).
- **Tokens never travel in URLs or logs** — they leak through referrers, proxies, and log
  aggregators.

## MFA and account security

- **MFA on anything valuable**: admin, money, PII surfaces. TOTP/WebAuthn over SMS (phishing-
  resistant first).
- **Brute-force defense** (`domains/abuse.md`): rate limiting + lockout with backoff + credential
  stuffing detection (the breached-password check).
- **Recovery flows are authn too**: password-reset tokens are credentials — short-lived,
  single-use, CSPRNG-generated, never in URLs that get logged.

## The login endpoint checklist (`harden` walks it)

Generic failure messages · constant-time comparison · rate-limited · lockout policy · MFA step
· session rotation on login (fixation defense) · secure session cookie · reset flow with
single-use expiring tokens.

## Bans (recap)

Fast hashes for passwords, `==` comparisons, tokens in URLs/logs, no expiry or revocation,
`alg: none`, hardcoded JWT secrets, enumeration-friendly errors, MFA-free admin surfaces.
