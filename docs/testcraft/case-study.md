# Case study: the generic AI suite → the testcraft pass

A before/after case study driven by the deterministic checker — the measured transformation
of a test suite, both directions.

## The before

A typical AI-generated checkout suite (`demos/testcraft/before.test.js`): an `it.only` left in,
skip debt, a tautological assertion (`expect(true).toBe(true)`), an empty test, a 500ms
sleep-as-sync, unseeded `Math.random()`, a truthiness-final assertion, and a
`retryTimes(3)` mask.

The checker's verdict (`node skill/testcraft/scripts/check.mjs --strict`):

```
ERROR focused-test           before.test.js:6   it.only(
ERROR tautological-assertion before.test.js:7   expect(true) toBe true
ERROR sleep-in-test          before.test.js:17  setTimeout(
WARN  skipped-test           before.test.js:10  it.skip(
WARN  empty-test             before.test.js:13  it("clears the cart", () => {})
WARN  random-in-test         before.test.js:18  Math.random()
WARN  retry-mask             before.test.js:22  retryTimes(

testcraft: 1 file(s) scanned · 3 error(s), 4 warning(s) · FAILED
```

## The pass

One testcraft pass — `prune` (the tautology, the empty test), `strengthen` (truthiness →
exact values and error contracts), `isolate` (the seed injected, the clock under control),
`flaky` (the retry mask removed — root cause, not the mask), `name` (behavior→outcome→
context) — produces `demos/testcraft/after.test.js`: the same contracts, stated honestly,
with `it.each` tables, seeded randomness, and rejects-with-code assertions.

```
testcraft: 1 file(s) scanned · 0 error(s), 0 warning(s) · clean ✓
```

## The aggregate view

`node skill/testcraft/scripts/suite-health.mjs --target . --history history.json` turns the
per-file verdict into a ranked report and a trend record — worst files first, per-rule
counts, appended history for the quarantine board's data.

## The claim

The transformation is verifiable in both directions, and the suite's *health* is a tracked
number, not a feeling. Test craft with a receipt.
