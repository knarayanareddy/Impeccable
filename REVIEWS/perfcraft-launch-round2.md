# Review: perfcraft launch artifacts — Round 2

**Panel:** Reference Keeper (verification) · Budget/Gate Expert (adversary re-pass) ·
Live-Tooling Engineer (adversary re-pass) · QA Evasion Engineer (harness re-pass) ·
Launch/Growth Reviewer (re-check).

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| B1 unmeasured honesty | ✅ | Unmeasured entries reported; all-unmeasured fails the shape (nothing-measured); fixed the print-loop/derivation split that muted it |
| L2 daemon protocol doc | ✅ | optimize-review.md shipped |
| M1 sheet wiring | ✅ | profile.md + optimize.md name the measurement sheets as their harness authority |
| Q2 unmeasured pins | ✅ | Both behaviors pinned (all-unmeasured fails; partial-unmeasured reports and holds) |

## Adversary re-pass findings (found and fixed)

| # | Sev | Finding | Resolution |
|---|---|---|---|
| A2-1 | **Major** | Wrong-shape budget (`resourceSizes` as an object) crashed with an uncaught `TypeError` — ugly exit 1 instead of a clear message | Up-front shape validation: arrays/objects enforced, exit 2 with a clear message; pinned by scenario |
| A2-2 | **Minor** | Non-object measurements (array) silently read as "all unmeasured" | Explicit exit 2 message; pinned by scenario |
| A2-3 | **Pass** | Daemon escaping; --json shape; the bounded-retry precision guards — all behave |

## Final verification

- **28/28** perfcraft scenarios green (checker rules, severities, windowed detection,
  bounded-retry precision guards, comment stripping, budget-check incl. unmeasured honesty +
  shape validation, optimize-review protocol incl. the number-less rejection)
- Suite runner green (criterion 24 · codecraft 27 · apicraft 33 · dbcraft 34 · testcraft 21 ·
  perfcraft 28)
- Demo: before FAILED (2 errors / 8 warnings), after clean ✓; budget gate blocks over-budget
  and passes under-budget
- Docs: 0 broken links; case study numbers match the real run

## Verdict

Facet 6 launch artifacts are review-clean after two rounds. No open findings.
