# Domain: Injection

Injection is the oldest vulnerability family and still the most damaging: the attacker's data
becomes the system's instructions. The defense is one habit: **treat input as data, at every
boundary, forever** (`domains/trust.md`).

## The sink table (input reaches these → the defense must already have run)

| Sink | The attack | The defense |
|---|---|---|
| SQL | SQL injection | Bound parameters, always (`sanitize`) |
| HTML/DOM | XSS — script in your origin | Text nodes / escaping / sanitizer + CSP |
| Shell | Command injection | Argument arrays, no shell, allowlists |
| File paths | Path traversal | Resolve + verify within the allowed root |
| URLs (fetch/redirect) | SSRF / open redirect | Allowlist hosts and schemes |
| Templates | SSTI | Sandbox/whitelist the template surface |
| Deserialization | RCE via crafted payloads | Never deserialize untrusted data (or safe codecs) |

## The three rules

1. **Parameterize, escape, or both** — the mechanism per sink, applied mechanically:
   - SQL: bound parameters (the ORM doesn't automatically save you — native queries and
     order-by columns need the same treatment).
   - HTML: never `innerHTML` with data (`anti-patterns.md` I2); text nodes, proper escaping per
     context (HTML/attribute/JS/URL are *different* contexts), or a vetted sanitizer (DOMPurify)
     where markup is genuinely needed.
   - Shell: argument arrays without a shell (`execFile`-style), no `exec("... " + input)`
     (`anti-patterns.md` I4).
2. **Validate shape at the boundary** — types, lengths, ranges, enums, formats. Validation
   reduces the attack surface; escaping makes it safe. Both, not either.
3. **Defense in depth for the big one (XSS): a Content-Security-Policy** that starts restrictive
   (`script-src 'self'`), plus no inline event handlers. The CSP is the net under the trapeze —
   you fix the trapeze *and* keep the net.

## Input handling protocol (the checklist)

Every input: declared type + constraints → validated at the boundary (reject on violation, one
response) → normalized (canonical form: encodings, case, Unicode) → used via the parameterized/
escaped mechanism for its sink → and the *output* is encoded for its output context.

## SSRF specifically (the modern favorite)

Any URL the server fetches on behalf of a caller: allowlist the scheme (https), the host, and
the port; block internal ranges (169.254.169.254, 10/8, localhost) and DNS rebinding
(resolve-then-connect to the resolved IP); disable redirects or re-validate each hop.

## Bans (recap)

String-built SQL, innerHTML-with-data, eval of input, shell concatenation, un-rooted file paths,
unrestricted fetches/redirects, unsafe deserialization, templates with full access.
