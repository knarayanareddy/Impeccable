# Command: strengthen

Weak assertions → contract-pinning assertions (`domains/assertions.md` is the authority). The
signature confidence move: a strengthened assertion is a green lie converted into a real promise.

## Steps

1. If the framework is Jest/Vitest, pytest, or Playwright, the matching
   `reference/frameworks/` sheet is the assertion-idiom baseline. Find the weak spots
   (checker + inspection): truthiness finals (`toBeTruthy`), existence-only
   checks (`toBeDefined`, `not.toBeNull` alone), `assert x`, `not.toThrow()` as the whole test,
   assert-on-mock-only tests, circular expected values.
2. For each, derive the contract the test *should* pin, from the spec or the public interface:
   what exact value, shape, state, or effect proves the behavior?
3. Strengthen per the ladder (`assertions.md`):
   - Truthy → exact value (`toEqual({status: "closed"})`).
   - Existence → shape + key values (`toMatchObject`).
   - No-throw → the outcome the operation produces.
   - Mock-only → assert the unit's output/state; keep interaction checks only at the boundary.
   - Circular → expected value computed by hand, stated as a literal.
4. Strengthen the failure message where the framework's diff won't say it: expected contract in
   the message, actual in the diff.
5. Run the strengthened tests: if a strengthened assertion fails, it discovered either a real
   behavior gap (file it — the test was right to doubt) or a wrong expectation (fix the
   expectation from the spec, never from the code under test).

## Exit criteria

- The weak-assertion list in `audit` addressed or explicitly deferred with a reason.
- Each strengthened test names its contract in the assertion; the green-lie test
  (`suite-floor.md` Reflexes) passes on the touched tests.

## Rules

- Strengthen asserts behavior, not implementation — the strengthened assertion must survive
  refactors that preserve behavior (`domains/units.md`).
- A failing strengthened assertion is a finding, not an inconvenience: report it, don't weaken
  it back.
