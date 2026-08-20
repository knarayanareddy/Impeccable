# Command: optimize

The bounded optimization loop: measure → fix one thing → verify → stop. The signature move — this
is where the floor's "no number, no optimization" rule gets executed. Load
`reference/perf-floor.md` before editing.

## The loop (always in this order)

1. **State the receipt:** the measured problem (from `profile`/`measure`), the attribution, the
   hypothesis ("the cart loop re-queries per item — that's 47 queries per checkout"), and the
   budget target.
2. **Fix one thing** — the smallest change that tests the hypothesis. One fix per pass: two fixes
   can't be attributed, and an optimization pass is an attribution exercise.
3. **Re-measure with the same harness** — same conditions, same data, same percentiles. Quote
   before/after: "checkout P95 480ms → 210ms, n=10k, same harness."
4. **Verify correctness** — behavior tests in the same change (`perf-floor.md` #5). Fast-and-wrong
   is a bug with better marketing.
5. **Decide and record:** the gain is real and worth its complexity → keep + record in PERF.md
   (and wire a budget so it can't regress); the gain is inside the noise floor → revert honestly;
   the hypothesis was wrong → that's a finding too, and it updates the attribution.
6. **Stop.** One verified fix per pass. Optimization is a loop with an exit, not a lifestyle.

## Guardrails

- Never optimize below the top of the flame graph — if the fix doesn't move the profile, it moved
  furniture (`perf-floor.md` Reflexes).
- Never trade correctness for speed: race conditions, dropped errors, and stale reads are not
  optimizations.
- Complexity is the price: if the fix's machinery outweighs the measured gain, it doesn't ship
  (`perf-floor.md` Reflexes).

## Exit criteria

- The receipt complete: before/after numbers, same harness, tests green, the budget updated (or
  the revert explained).
