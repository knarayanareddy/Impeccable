# Command: lock (check mode)

The lock command's checklist as a mechanical gate: apply the secure-defaults standard to a
config file and report every missing default. The gate blocks on gaps — the "lock" doctrine
in tool form, CI-ready.

## Usage

```bash
node <skill-dir>/scripts/lock-check.mjs --config config.json
node <skill-dir>/scripts/lock-check.mjs --config config.json --json
```

Exit 0 = all defaults present · exit 1 = gaps · exit 2 = usage error.

Config shape (generic key:value):

```json
{
  "headers": { "csp": "…", "hsts": "…", "xContentTypeOptions": "nosniff", "frameOptions": "DENY" },
  "cookies": { "secure": true, "httpOnly": true, "sameSite": "lax" },
  "cors": { "origin": ["https://app.example.com"] },
  "tls": { "minVersion": "1.2", "redirectHttp": true },
  "debug": false
}
```

## What it enforces

- **Headers**: CSP, HSTS, X-Content-Type-Options, frame protection (`lock.md`'s standard set).
- **Cookies**: Secure + HttpOnly + SameSite on auth cookies (`anti-patterns.md` A5).
- **CORS**: an explicit origin allowlist — `*` on an authenticated API is a gap (K2).
- **TLS**: a stated minimum (≥1.2) and HTTP→HTTPS redirect.
- **Production posture**: debug off, stack traces off (K1/K3).

## CI wiring

`--json` + exit codes make this a deploy gate: export the effective config to the generic
shape (an adapter per framework — helmet, nginx, the app's config module), check, fail the
deploy on gaps. Every loosening is then a reviewed diff, never a silent default.
