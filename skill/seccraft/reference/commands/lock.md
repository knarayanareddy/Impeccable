# Command: lock

Secure defaults: headers, TLS, cookies, CORS, sessions, and production configuration. The pass
that removes the free attack surface — everything here is a default the attacker was counting on.

## Steps

1. Audit the current configuration per surface: headers, CORS policy, cookie flags, session
   config, TLS settings, debug/stack-trace exposure, and any demo credentials or sample data
   (`anti-patterns.md` K1–K5).
2. Apply the defaults:
   - **Headers:** HSTS (with a sensible max-age), CSP (starting restrictive — `script-src
     'self'` — then loosened only with evidence), X-Content-Type-Options: nosniff,
     X-Frame-Options/frame-ancestors, Referrer-Policy. The standard set, everywhere.
   - **CORS:** an explicit origin allowlist; never `*` with credentials, never `*` on
     authenticated APIs (`anti-patterns.md` K2).
   - **Cookies:** `Secure` + `HttpOnly` + `SameSite` on every auth/session cookie; explicit
     `Secure` even behind the proxy (`anti-patterns.md` A5).
   - **Sessions/tokens:** short lifetimes, rotation on privilege change, revocation paths
     (`domains/authn.md`).
   - **TLS:** ≥1.2, 1.3 preferred, modern cipher suites, HSTS enforced, HTTP → HTTPS redirect.
   - **Production profile:** debug off, stack traces to logs only, demo data absent, default
     credentials changed (`security-floor.md` #4).
3. Encode the configuration as code where possible (the header middleware, the CORS module) —
   defaults that live in the repo are defaults that are reviewed and diffed.
4. Verify: the checker clean on config; a test request confirms the headers, the cookie flags,
   and the CORS policy; production config reviewed as a diff, not as folklore.

## Exit criteria

- The standard header set present; CORS/cookies/TLS locked; debug and demo defaults gone;
  configuration version-controlled and verified by test.

## Rules

- Lock fixes defaults; it doesn't redesign authn/authz (those are `harden`/`authz`).
- Every loosening is an explicit, documented exception — "the third-party embed needs it" goes
  in the config comment with the owner's name, not silently in the diff.
- Security headers without a test are aspirations: the request-level assertion is the proof.
