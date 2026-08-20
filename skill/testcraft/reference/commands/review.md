# Command: review

Confidence review with scoring — the judgment pass `audit`'s defect scan can't do. The one
question: **if this suite is green, would you deploy?** No edits.

## Scorecard (1–5 each)

| Dimension | The question |
|---|---|
| Contract coverage | Do the tests pin the observable behaviors — happy paths, boundaries, errors, states (`cases.md`)? |
| Assertion strength | Would the assertions catch wrong-but-plausible outputs (`assertions.md`)? |
| Honesty | Is every green believable — no tautologies, no circular mocks, no empty tests (`suite-floor.md` #1)? |
| Isolation & determinism | Can the suite run in any order, in parallel, twice (`determinism.md`)? |
| Level discipline | Is each test at the cheapest level that proves it (`e2e.md`)? |
| Fidelity | Do fixtures and fakes mirror production truthfully (`fakes.md`)? |
| Failure diagnostics | Does a red name the broken contract without opening the test body? |
| Maintainability | Would a refactor that preserves behavior leave the suite untouched? |
| Speed | Does the suite's duration respect the team's daily cost (`speedup`)? |
| Regression memory | Are past production bugs pinned (`coverage.md` #4)? |

## Steps

1. Read the suite top to bottom as a new engineer would: can you reconstruct what the system
   promises from the tests alone?
2. Spot-check three claims: pick three behaviors, find their tests, and ask — if the behavior
   broke subtly, would the test fail? (The green-lie test, applied concretely.)
3. For every score below 4, name the exact test/file and the contract it fails to pin.
4. Deliver: the scorecard, the three highest-leverage fixes (ranked by risk), one honest
   strength, and one "bold move" — the single change that would most raise deploy confidence.

## Rules

- Review the suite, not its authors; praise is specific or omitted.
- If the suite has no E2E at all (or no integration), that's not a dimension score — it's the
  first finding.
- No edits in review; follow-up commands (`strengthen`, `cover`, `isolate`, `prune`...) pick up
  the ranked list.
