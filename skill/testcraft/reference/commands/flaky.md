# Command: flaky

Hunt and fix flaky tests — root cause, never retry-masking (`domains/determinism.md` is the
authority). The highest-credibility repair in the suite: one fixed flake is a whole team
re-learning to trust red.

## Steps

1. Identify the suspects: CI retry logs, runner quarantine history, the tests that fail
   intermittently in `measure`'s output. One flake at a time — flake-hunting is bisection work.
2. **Reproduce locally, or stop.** Loop the suspect (the runner's repeat/randomize-order/randomize-
   seed flags) until it fails. No reproduction, no fix — only suspicion, and suspicion is not a
   fix.
3. Classify the cause against the taxonomy (`domains/determinism.md`): time · randomness ·
   async race · order dependence · data dependence · resource contention · external flake ·
   locality.
4. Fix at the root:
   - Time → fake timers / injected clock.
   - Randomness → seed per test.
   - Async race → `waitFor(statePredicate)`, fake timers for scheduled work.
   - Order/shared state → `isolate` (fresh fixtures, per-test resources).
   - Data → seeded data, no pre-existing rows.
   - External → fake/record the service; never live in CI.
   - Locality → pin TZ/locale per suite.
5. Prove the fix: run the suspect 50–100× (and the suite in random order, twice). Zero failures
   is the exit criterion — one failure means the root cause wasn't it.
6. Remove the stopgap: if a retry/quarantine was in place, delete it only after the proof run —
   and close the ticket.

## Rules

- Retries are a stopgap with a ticket, never a fix. Leaving `retryTimes(3)` and calling it done
  is the anti-pattern (`suite-floor.md` #10).
- Fix the test's cause; if the cause is the *product* (a real race), that's a product bug — file
  it, and pin the test to the fixed behavior.
- Flaky E2E is a P1: it costs minutes and poisons every other signal (`domains/e2e.md`).

## Exit criteria

- Root cause named, fix in place, proof run clean (50–100× + randomized order), stopgap removed,
  ticket closed.
