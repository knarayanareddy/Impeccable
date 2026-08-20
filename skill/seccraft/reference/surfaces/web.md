# Surface sheet: Web application

Loaded with the relevant domains when the surface is a web application. The surface-native
attack surface and controls; the compass domains still hold.

## The attack surface (web-shaped)

- **The browser is the attacker's console**: every request, header, and payload is
  inspectable — trust nothing client-visible (`domains/trust.md`).
- The big three: **XSS** (script in your origin), **CSRF** (the cookie-auth companion), and
  **session theft** (insecure cookies, no expiry/revocation). `domains/injection.md`,
  `domains/authn.md` own the playbooks.
- **The supply chain is part of the surface**: third-party scripts get SRI; the CSP is the
  net under the trapeze — restrictive first, loosened with evidence (`lock`).

## The controls to wire (the web checklist)

| Control | Where |
|---|---|
| CSP (`script-src 'self'` baseline) + no inline handlers | `lock` |
| HSTS + HTTP→HTTPS | `lock` |
| Secure + HttpOnly + SameSite cookies, short sessions, rotation | `authn.md` |
| CSRF: SameSite baseline + token/double-submit or Origin checks on cookie-auth state changes | `authn.md`'s CSRF section |
| SRI on third-party scripts | `lock` |
| AuthN + **object-level authz** on every route (`authz.md`'s matrix) | `authz` |
| Rate limits + lockout on login (`abuse.md`) | `harden` |
| No secrets in bundles/JS; runtime injection only (`secrets.md`) | `secrets` |

## The web-specific traps

- `innerHTML`/`dangerouslySetInnerHTML` with data — the checker's `xss-dangerous` rule, in the
  wild (`anti-patterns.md` I2).
- Redirects to user-supplied URLs (open redirect → token leakage) — allowlist destinations
  (`injection.md`'s sink table).
- CORS `*` with credentials, or `*` on an authenticated API (`anti-patterns.md` K2).
- Tokens in URLs or logs — they leak through referrers and aggregators (`authn.md`).

## Bans

CSP-less XSS defense · cookies without the triple · open redirects · permissive CORS ·
secrets in bundles · client-side-only authz · sessions without revocation.
