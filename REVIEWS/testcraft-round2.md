# Review: testcraft (testing) — Round 2

**Panel:** Reference Keeper (verification) · Second Domain Principal (Playwright/CI specialist) ·
Adversary (checker red-team) · Practitioner (re-check)

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| R1-1/R1-2 shortcuts + hooks | ✅ | Both added |
| D1-1 property-based testing | ✅ | cases.md section (invariant + shrinking) + harden.md pairing |
| D1-2 characterization tests | ✅ | cases.md section (observed-vs-specified labeling, refactor-under-green) |
| D1-3 Testcontainers | ✅ | Named in integration.md |
| A1-1 network exemption | ⏳ | Documented in mapping — implementation in this round |
| A1-2 mapping ids | ✅ | Rule ids named |
| P1-1 TESTS template | ✅ | assets/TESTS.example.md shipped |

## Fresh-eyes findings (Second Domain Principal — Playwright/CI specialist)

| # | Sev | Finding |
|---|---|---|
| F2-1 | **Pass** | e2e domain already mandates trace/video artifacts on failure and waitFor-not-sleep — current. No changes. |

## Adversary (checker red-team)

| # | Sev | Finding |
|---|---|---|
| A2-1 | **Major** | `empty-test` misses **comment-only bodies**: `it("x", () => { /* TODO */ })` — green with a shrug. Add. |
| A2-2 | **Major** | `tautological-assertion` misses **same-identifier tautologies**: `expect(x).toBe(x)`, `assertEqual(a, a)` — can never fail. Add. |
| A2-3 | **Minor** | `retry-mask` misses Mocha's `this.retries(3)` and Jest's `jest.retryTimes(3, {logErrorsBeforeRetry})` call form (the second arg form). Add both. |
| A2-4 | **Minor** | `network-in-test` must implement the integration/e2e path exemption (carried from A1-1): files under integration/e2e/api dirs are *honestly* networked. |
| A2-5 | **Pass** | Sleep, randomness, focused/skipped, and no-assertion-file rules survive probing. |

## Practitioner re-check

| # | Sev | Finding |
|---|---|---|
| P2-1 | **Pass** | Round-1 usability concerns resolved. |

## Verdict (Round 2)

Accept A2-1, A2-2, A2-3, A2-4. Implement all. After this pass, testcraft is review-clean.
