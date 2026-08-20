# Command: measure

The quantitative pass. Numbers, not adjectives. Complements `review` (judgment) and `audit`
(defects). No edits.

## What gets measured

1. **Shape of the suite** — test counts per level (unit / integration / E2E); the pyramid vs the
   ice-cream cone (`anti-patterns.md` L3); files with tests but no assertions.
2. **Skip & focus debt** — skipped tests (count, with-reason %, age); focused tests present;
   empty tests.
3. **Assertion density** — assertions per test (median and distribution); the weak-assertion
   count (truthiness/existence finals) by inspection on a sample.
4. **Determinism signals** — sleeps, unseeded randomness, retry masks (checker counts); flaky
   history from the runner logs (failures per test over the last N runs).
5. **Durations** — suite total; per-level totals; slowest 10 tests (name + seconds); the daily
   tax (suite time × runs per day per engineer).
6. **Coverage by risk tier** (`coverage.md`): per-tier percentages against the policy floors in
   TESTS.md — not one global number.
7. **Regression memory** — production bugs from the last quarter vs bug-pinning tests added.

## Output

A measurement report: per-metric table with numbers, the floor comparison against
`suite-floor.md` and TESTS.md's policies, then the ranked delta list — cheapest change to highest
confidence gain.

## Rules

- Every number cites its method (checker / runner logs / coverage tool / inspection). If a metric
  can't be measured with available tooling, report "not measured" — never guess.
- Quote before/after numbers around any subsequent refactor pass — that's how suite craft becomes
  visible.
