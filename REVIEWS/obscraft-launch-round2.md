# Review: obscraft launch artifacts — Round 2

**Panel:** Reference Keeper (verification) · Telemetry-Shape Expert (adversary re-pass) ·
SLO/Alert Tooling Engineer (adversary re-pass) · QA Evasion Engineer (harness re-pass) ·
Launch/Growth Reviewer (re-check).

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| T1 metric-type vocabulary | ✅ | counter/gauge/histogram/summary enforced; `"guage"` flagged |
| T2 accepted shapes | ✅ | Container/list/entries forms documented |
| A1 daemon protocol doc | ✅ | slo-review.md shipped (--timeout, trusted network, collision exit 2) |
| Q1 type pin | ✅ | unknown-type scenario added |

## Adversary re-pass findings (found and fixed)

| # | Sev | Finding | Resolution |
|---|---|---|---|
| A2-1 | **Critical** | The whole daemon harness family used **fixed ports** — a stale daemon from one run silently poisoned the next (the obscraft scenario failure's root cause; the EADDRINUSE crash was the symptom) | All eight daemons exit 2 cleanly on collision (build-time fix); all seven remaining harnesses migrated to pid-unique ports; suite runner green end-to-end |
| A2-2 | **Minor** | Single-object JSON alerts refuse — honest but abrupt | Confirmed per the documented shapes (array or `entries`-wrapped); the refusal message names the fix |
| A2-3 | **Pass** | `target: 1.0` string flags; string-entry metrics flag three gaps; empty-file refusal; daemon escaping — all behave |

## Final verification

- **21/21** obscraft scenarios green (checker rules, severities, comment stripping, the
  question-first gate incl. the vocabulary + refusal rules, the slo-review protocol incl.
  gap callouts and the port-collision pin)
- Suite runner green (criterion 24 · codecraft 27 · apicraft 33 · dbcraft 34 · testcraft 21 ·
  perfcraft 28 · seccraft 26 · obscraft 21 = **214 pinned behaviors**)
- Demo: before code FAILED (1 error / 8 warnings) + 4 shape gaps; after clean both ways
- Docs: 0 broken links; case study numbers match the real run

## Verdict

Facet 8 launch artifacts are review-clean after two rounds. No open findings.
