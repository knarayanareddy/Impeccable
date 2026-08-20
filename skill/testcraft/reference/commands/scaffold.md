# Command: scaffold

Create the test skeleton from `shape`'s case inventory: files, named test stubs, and the fixture
seams — before the implementation (or beside it).

## Steps

1. Take the approved case table from `shape` (or build a minimal one if the request came without
   it — never scaffold without cases).
2. Create the files at the levels assigned, following TESTS.md conventions:
   - Unit: one describe/suite per behavior, one named test per case (`name` conventions:
     behavior → outcome → context).
   - Integration: the seam setup (migrations, container, fake service) in the fixture helpers,
     one test per case.
   - E2E: the journey file with the data-testid hooks named — the selectors are part of the
     scaffold (`domains/e2e.md`).
3. Each stub test asserts the expected outcome from the case table — even if the implementation
   doesn't exist yet (TDD: red first). A scaffold full of `expect(true).toBe(true)` is not a
   scaffold, it's a lie (`suite-floor.md` #1).
4. Wire the fixtures: realistic data shapes, seeded determinism, the clock/RNG seams where the
   cases need them (`domains/determinism.md`).
5. Verify: the suite runs, the new tests are red for the right reason (missing behavior), and
   nothing else broke.

## Rules

- Scaffold follows the case table exactly — no creative extra tests, no dropped cases.
- Stubs carry the real assertions, not placeholders; a red stub is the contract written as a test.
- One behavior per test; parameterize with tables where cases are the same behavior's edges
  (`domains/units.md`).
