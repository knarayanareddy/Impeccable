# Review: apicraft (API design) — Round 2

**Panel:** Reference Keeper (verification) · Second Domain Principal (webhook/integration
specialist) · Adversary (checker red-team) · Practitioner (re-check)

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| R1-1/R1-2 shortcuts + hooks | ✅ | Both added (suite-wide conventions) |
| R1-3 spec-lint | ✅ | check.mjs now validates OpenAPI operations: missing responses blocks, missing operationIds — block-accurate, clean on a correct spec |
| D1-1 RFC 9457 | ✅ | errors.md aligns the envelope with Problem Details |
| A1-1 no-spec-file scope | ✅ | Project-scope scans only; single-file targeted scans no longer false-positive |
| A1-2 mapping ids | ✅ | Actual rule ids named |
| P1-1/P1-2 templates | ✅ | `assets/API.example.md` + `assets/openapi.example.yaml` shipped (the example spec passes the new lint clean) |

## Fresh-eyes findings (Second Domain Principal — webhook/integration specialist)

| # | Sev | Finding |
|---|---|---|
| F2-1 | **Major** | idempotency domain covers webhook event dedupe but **not signature verification** — the industry baseline for webhook security (HMAC-SHA256 with a shared secret, timestamp replay window). Add it. |

## Adversary (checker red-team)

| # | Sev | Finding |
|---|---|---|
| A2-1 | **Major** | `verb-in-url` is case-sensitive and boundary-narrow: `/api/getuser` and `/api/get-user` slip through (regex needs `[A-Z]` after the verb). Add case-insensitive matching with `[-_/]`/digit boundaries. |
| A2-2 | **Major** | `interpolated-sql` misses Python's `.format()` and `%`-formatting injection: `"SELECT * FROM t WHERE id = {}".format(x)` and `"SELECT * FROM t WHERE id = %s" % (user,)`. Add both. |
| A2-3 | **Minor** | `hardcoded-credential` misses env fallbacks: `const key = process.env.KEY || "sk-..."` — the fallback IS a committed credential. Flag it. |
| A2-4 | **Pass** | `success-wrapper`, `deep-resource-nesting` (verb-aware), `mixed-field-casing` (with mapping-boundary escape hatch) survive probing. |

## Practitioner re-check

| # | Sev | Finding |
|---|---|---|
| P2-1 | **Pass** | Round-1 usability concerns resolved. |

## Verdict (Round 2)

Accept F2-1, A2-1, A2-2, A2-3. Implement all. After this pass, apicraft is review-clean.

## Cross-skill routing note

A2-2 (Python `.format()` / `%`-formatted SQL injection) routes to **seccraft**'s review: SQL
injection is seccraft's scope (its `interpolated-sql` rule owns the class), and apicraft's
anti-patterns deliberately cross-reference seccraft for injection. Carried forward as finding
SEC-A2-2 in seccraft's Round 2.
