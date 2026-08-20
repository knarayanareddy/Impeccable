# Case study: the generic AI security → the seccraft pass

A before/after case study driven by the deterministic checker and the lock-check gate — the
measured transformation, both directions, plus the config gate.

## The before

A typical AI-generated auth/orders module (`demos/seccraft/before.js` + `before-config.json`):
a hardcoded API key, `innerHTML` with data, string-built SQL, `Math.random` tokens, MD5
passwords, `eval`, permissive CORS with credentials, insecure cookies, and debug on.

The checker's verdict (`node skill/seccraft/scripts/check.mjs --strict`):

```
ERROR hardcoded-credential before.js:5   apiKey = "<redacted>"
ERROR xss-dangerous        before.js:8   innerHTML with dynamic data
ERROR interpolated-sql     before.js:12  interpolated SQL
WARN  math-random-token    before.js:16  Math.random() for security
WARN  insecure-hash        before.js:20  md5(
WARN  code-injection       before.js:24  eval(

seccraft: 1 file(s) scanned · 3 error(s), 0 warning(s) · FAILED
```

And the lock-check gate on the config:

```
GAP headers    csp    missing csp — the free defense nobody enabled
GAP cookies    secure auth cookies must be Secure
GAP cors       origin origin "*" on an authenticated API
GAP production debug  debug mode on in production config
… 11 gaps · FAILED
```

## The pass

One seccraft pass — `secrets` (env-injected key), `sanitize` (text nodes, bound parameters),
`lock` (the full header/cookie/CORS/TLS set), `harden` (CSPRNG tokens, argon2id, sandboxed
plugins) — produces `demos/seccraft/after.js` + `after-config.json`:

```
seccraft: 1 file(s) scanned · 0 error(s), 0 warning(s) · clean ✓
lock-check: all secure defaults present ✓
```

## The claim

The transformation is verifiable in both directions, and the config is a *gate*, not a
document — every loosening becomes a reviewed diff. Security craft with a receipt.
