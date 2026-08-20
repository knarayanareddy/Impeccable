# Review: seccraft (security) — Round 2

**Panel:** Reference Keeper (verification) · Second Domain Principal (cryptography specialist) ·
Adversary (checker red-team) · Practitioner (re-check)

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| R1-1/R1-2 shortcuts + hooks | ✅ | Both added |
| R1-3 threat-model template | ✅ | assets/threat-model.example.md (boundaries → threats×controls×gaps → ticketed) |
| D1-1 CSRF | ✅ | authn.md section: SameSite baseline + token/double-submit + Origin checks, per-surface decision |
| D1-2 SRI | ✅ | lock.md: integrity+crossorigin on third-party scripts |
| D1-3 CWE anchors | ✅ | Anti-patterns header maps each tell to its CWE |
| A1-1 mapping ids | ✅ | Rule ids named |
| P1-1 SECURITY template | ✅ | assets/SECURITY.example.md shipped |

## Fresh-eyes findings (Second Domain Principal — cryptography specialist)

| # | Sev | Finding |
|---|---|---|
| F2-1 | **Minor** | crypto.md should state **constant-time comparison for MAC/signature verification** (not just password checks) — the webhook-signing companion. One line. |

## Adversary (checker red-team)

| # | Sev | Finding |
|---|---|---|
| A2-1 | **Major** | **Carried SEC-A2-2:** `interpolated-sql` misses Python `.format()` and `%`-formatted SQL — the two most common Python injection shapes. |
| A2-2 | **Major** | `weak-jwt` misses `jsonwebtoken.sign(payload, "hardcoded...")` and destructured `sign(payload, "hardcoded")` — only `jwt.sign` matched. |
| A2-3 | **Major** | `hardcoded-credential` misses **`.env` unquoted values** (`API_KEY=sk-abc123…` — no quotes). |
| A2-4 | **Minor** | `code-injection` misses the `setTimeout("code", …)` string-eval form. |
| A2-5 | **Pass** | Private keys, alg:none, eval/Function, xss sinks, command concat, insecure cookies, permissive CORS, Math.random survive probing. |

## Practitioner re-check

| # | Sev | Finding |
|---|---|---|
| P2-1 | **Pass** | Round-1 usability concerns resolved. |

## Verdict (Round 2)

Accept F2-1, A2-1, A2-2, A2-3, A2-4. Implement all. After this pass, seccraft is review-clean.
