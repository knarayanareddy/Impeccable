# Command: isolate

Remove shared state and execution-order dependence — the tests must run alone, in any order, in
parallel, a hundred times (`domains/determinism.md` is the authority).

## Steps

1. If the framework is Jest/Vitest, pytest, or Playwright, the matching
   `reference/frameworks/` sheet is this command's framework authority (isolation flags,
   fixtures, contexts). Then find the couplings (inspection + the order-dependence probe):
   - Global/static mutable state (singletons with memory, module-level caches, env vars set and
     never reset).
   - Shared resources (one DB per suite with no per-test cleanup, shared files, shared ports).
   - Order assumptions (test B reads what test A wrote; fixtures created in one file consumed in
     another).
   - Inter-test timers/randomness leaking past teardown.
2. For each coupling, apply the isolation pattern:
   - **Fresh fixtures per test** — seed/truncate/transaction-rollback per test; every test owns
     its data.
   - **Per-test resources** — per-test DB schema (containers), per-test temp dirs, per-test
     ports.
   - **No globals** — inject the dependency or reset in `beforeEach`/`afterEach` (reset is the
     second choice; injection is the first).
   - **Fake the clock/RNG per test** — nothing scheduled or random survives a test boundary.
3. Prove the isolation: run the affected files in randomized order, in parallel, twice. Green
   in every order is the exit criterion — one order-dependent failure means a coupling remains.
4. Wire the CI order-randomization (seeded shuffle) permanently — isolation is enforced by the
   pipeline, not by memory.

## Exit criteria

- No test reads state another test wrote; resources owned per test; the randomized-order and
  parallel runs green; CI shuffle enabled.

## Rules

- Isolate the tests' world, not the product's design. If the *product* has hidden global state
  that makes tests order-dependent, that's a product finding — file it; don't paper it over with
  test-order tricks.
- Never fix order dependence by making the suite run serially in a fixed order — that's masking,
  and it makes the suite slower while keeping the trap.
