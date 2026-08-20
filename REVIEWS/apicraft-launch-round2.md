# Review: apicraft launch artifacts — Round 2

**Panel:** Reference Keeper (verification) · Contract-Tooling Expert (adversary re-pass) ·
Live-Tooling Engineer (adversary re-pass) · QA Evasion Engineer (harness re-pass) ·
Launch/Growth Reviewer (re-check).

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| C1 successor guidance | ✅ | contract-diff.md states the deliberate no-heuristic position |
| C2 limitation statement | ✅ | Known limitations section: no `$ref`-following, rename pairs — stated, not silent |
| L1 n/a verdict | ✅ | Review page gained the abstain verdict; server accepts it |
| S1 gRPC status+details | ✅ | The pairing named in the sheet |
| Q1 deprecated-in-new pin | ✅ | Both exemption directions pinned |
| R1 diff count | ✅ | RESULT line carries the count; single diff execution |

## Adversary re-pass findings (found and fixed)

| # | Sev | Finding | Resolution |
|---|---|---|---|
| A2-1 | **Critical** | contract-diff claimed "YAML or JSON" but JSON specs extracted **zero operations** — a removed operation in a JSON spec passed clean (false negative on the tool's core promise) | JSON now parses natively (`JSON.parse` → object-tree walk); pinned by pretty- and single-line JSON scenarios |
| A2-2 | **Minor** | Block-form `enum:` lists un-pinned | Scenario added; block + flow forms both covered |
| A2-3 | **Minor** | Review page escaping un-pinned | Scenario added (payload-level assertion — the page's own `<script>` taught us the lesson) |

## Final verification

- **33/33** apicraft scenarios green (checker rules, severities, spec-lint, contract-diff
  incl. YAML + JSON + flow/block enums + deprecated semantics both directions, review-daemon
  protocol incl. n/a + escaping)
- Suite runner green (criterion 24 · codecraft 27 · apicraft 33)
- Demo: before FAILED (4 errors / 12 warnings), after clean ✓; contract-diff reports the
  6-breaking rewrite honestly in the RESULT line
- Docs: 0 broken links; case study numbers match the real run

## Verdict

Facet 3 launch artifacts are review-clean after two rounds. No open findings.
