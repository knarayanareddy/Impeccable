# Command: speedup

Make the suite fast without losing confidence. Suite duration is a daily tax on every engineer,
every commit — this command audits the tax and cuts it.

## Steps

1. Measure first: per-level and per-test durations (`measure` or the runner's timing), the
   slowest 10 tests, and the suite's total. Numbers before opinions.
2. Classify the slow tests:
   - **Wrong level** — E2E proving what a unit proves → move the contract down
     (`domains/e2e.md`). The biggest single win.
   - **Real I/O in units** — network/filesystem calls in unit clothing → fake the seam
     (`domains/fakes.md`).
   - **Expensive setup** — re-migrating the DB per test, rebuilding fixtures per test, cold
     containers per test → share setup per suite/worker (keeping per-test data isolation —
     sharing setup ≠ sharing state).
   - **Sleeps** — `sleep(500)` in the wait path → `waitFor` predicates (`flaky`'s fix doubles as
     speedup).
   - **Serialization** — tests that can't run in parallel because of shared state → `isolate`
     first, then parallelize.
3. Cut in impact order, verifying after each: same contracts covered (no deleted cases), suite
   green, durations quoted before/after.
4. Wire the budget: record the per-level duration targets in TESTS.md; CI warns (or fails) when
   the suite crosses them.

## Guardrails

- Speedup never deletes cases to hit a number — moving a contract to a cheaper level is allowed;
   dropping it is not.
- Parallelism comes after isolation (`isolate`) — parallelizing an order-dependent suite makes
   it flaky-fast.
- The slowest test often encodes the highest-value contract (the money-path E2E). Its cost is
   justified or it isn't — the answer is measured, not assumed.

## Exit criteria

- Before/after durations quoted per level and total; the slowest-10 list refreshed; budget
  targets in TESTS.md; suite green with the same case inventory.
