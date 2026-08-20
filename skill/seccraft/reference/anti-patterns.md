# Anti-patterns: the security-slop tells

(CWE anchors: S1→CWE-798, A1→CWE-639/IDOR, A3→CWE-347, I1→CWE-89, I2→CWE-79, I3→CWE-95,
I4→CWE-78, I6→CWE-330, C1→CWE-916/328, K2→CWE-942, K3→CWE-209. The shared vocabulary with
OWASP ASVS/CWE Top 25 — cite these in findings so tickets speak the industry's language.)

The fingerprints of software whose security was an afterthought — written by an agent (or a team)
that shipped the demo defaults. Each is a defect: not always a breach today, always a breach
invitation. Most have a deterministic rule in `scripts/check.mjs`; the rest are LLM-judged with
this file loaded.

## Secrets tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| S1 | Hardcoded credentials (`apiKey = "sk-..."`, passwords in code/comments) | The first thing attackers grep; also lands in every clone | Vault/secret manager + env injection + rotation |
| S2 | Private keys committed (`BEGIN PRIVATE KEY`) | The crown jewels in git history — history never forgets | Remove + rotate + git-history scrub if public |
| S3 | Secrets in CI logs (env dumps, config prints) | Build logs are shared infrastructure | Redact, never print config wholesale |
| S4 | One secret everywhere (no scoping/rotation) | Blast radius = everything the secret touches | Per-environment scoped secrets, rotation schedule |

## Auth tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| A1 | Authn without authz (login checks, then any user's objects) | IDOR/BOLA — the #1 exploited vuln class | Object-level checks on every resource access (`authz`) |
| A2 | Auth disabled "for now" (`AllowAnonymous`, `permitAll`, `no_auth`) | "For now" ships; the route stays open | Secure first; a bypass is an explicit, reviewed, logged exception |
| A3 | JWTs with `alg: none` or hardcoded secrets | Forged tokens; one leaked secret forges all | Verify signature, RS256 with proper keys, or the platform session |
| A4 | No expiry/revocation on tokens and sessions | Stolen = forever | Short lifetimes, refresh + revocation lists |
| A5 | Insecure cookies (`secure: false`, `httpOnly: false`) | Session theft via any MITM or any XSS | secure + httpOnly + SameSite on every auth cookie |
| A6 | Passwords compared with `==` (non-constant-time) | Timing attacks over the network | Constant-time compare (`timingSafeEqual`/`hash_equals`) |

## Injection tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| I1 | String-built SQL from inputs | SQL injection — the oldest, still the worst | Bound parameters, everywhere (`sanitize`) |
| I2 | `innerHTML` / `dangerouslySetInnerHTML` with user data | XSS: the attacker's script in your origin | Text nodes / proper escaping / sanitizer + CSP |
| I3 | `eval` / `new Function` / `document.write` with dynamic input | Code injection with your app's privileges | Never evaluate input; JSON.parse for data |
| I4 | Shell commands by concatenation (`exec("rm " + file)`) | Command injection | Argument arrays, no shell, allowlists |
| I5 | Redirects to user-supplied URLs | Open redirect → phishing and token leakage | Allowlist destinations, or relative paths only |
| I6 | `Math.random()` for tokens/IDs | Predictable = guessable = stealable | CSPRNG (`crypto.randomBytes`/`secrets`) |

## Crypto tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| C1 | MD5/SHA-1 for passwords or security hashing | Broken; rainbow tables for free | argon2id / bcrypt / scrypt |
| C2 | ECB mode, hardcoded IVs, hand-rolled ciphers | Cryptography is not a hobby | AES-GCM / chacha20-poly1305 from the stdlib |
| C3 | Encryption keys generated from passwords without KDF | Weak keys, fast brute force | PBKDF2/scrypt/argon2 KDF |
| C4 | "Encrypted" but keys on the same disk as data | Encryption theater | Key management (KMS/vault) separate from data |
| C5 | Plain HTTP for anything security-relevant | Everything is visible to the network | TLS everywhere; HSTS |

## Configuration tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| K1 | Demo defaults shipped (default passwords, sample keys, debug mode) | Attackers know the defaults better than you | `lock`: production config reviewed, debug off |
| K2 | CORS `*` with credentials / on authenticated APIs | Any origin can read authenticated responses | Explicit origin allowlist |
| K3 | Stack traces to clients in production | Recon gold: paths, versions, queries | Log server-side; generic error to client |
| K4 | Security headers absent (CSP, HSTS, X-Content-Type-Options...) | The free defenses nobody enabled | `lock`: the standard header set + a CSP that starts restrictive |
| K5 | Secrets in plaintext config files | The config is in the repo, the backup, the laptop | Vault/env injection at deploy |

## Dependency & data tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| D1 | Unpinned, unaudited dependencies | A known CVE is a known breach | Lockfiles + CI audit (`depend`) |
| D2 | Over-collected, over-stored data (PII "in case") | The data you don't have can't leak | Minimize; retention policy |
| D3 | Secrets/credentials in logs (request bodies logged wholesale) | The log is now a credential store | Redact; structured logging with a deny-list |
| D4 | Admin actions unlogged | Breach forensics start from nothing | Audit log: auth events, authz denials, admin actions |

## Detector mapping

`scripts/check.mjs` deterministically catches, with these rule ids: `hardcoded-credential` (S1,
redacted), `committed-private-key` (S2), `auth-disabled` (A2), `weak-jwt` (A3), `insecure-cookie`
(A5), `interpolated-sql` (I1), `xss-dangerous` (I2), `code-injection` (I3), `command-injection`
(I4), `math-random-token` (I6), `insecure-hash` (C1), `insecure-transport` (C5),
`permissive-cors` (K2), `stack-trace-response` (K3), `no-security-config` (K4, project-wide).
The rest are LLM-judged — keep this file loaded when auditing or threat-modeling.
