# Command: harden

Edge cases: boundaries, error paths, and the bug-pinning test (`domains/cases.md` is the
authority). The pass that turns a feature's tests from "it works" into "it can't quietly break".

## Steps

1. Take the behavior(s) in scope and list the missing cases from the inventory: boundaries
   (zero/one/max/±1, empty, limits), error paths (invalid input, failed I/O, timeout,
   permissions), state transitions (and the forbidden ones), concurrency (where real).
2. Add the cases at the cheapest level that proves them — usually unit, with tables for the
   boundary walk (`domains/units.md`); for pure logic, add the property-based twin (the invariant
   the generator searches) alongside the hand-picked boundaries (`domains/cases.md`).
3. For every related production bug (git log, tracker), add the bug-pinning test: the exact
   input that broke, the expected behavior, a comment linking the bug id. This is non-negotiable
   — a bug without its pin is a bug that will ship again (`coverage.md` #4).
4. Check the error contracts specifically: error codes/types asserted, not message substrings;
   forbidden transitions asserted; side effects asserted absent (the failed save wrote nothing).
5. Run the new cases; a failing new case is a discovery — either the behavior has a real gap
   (file it, fix it, then keep the test) or the expectation was wrong (fix from the spec, never
   from the code under test).

## Exit criteria

- The case inventory for the behavior is complete at the chosen levels; each bug pinned; the
  suite green with the new cases; the case table recorded for future `shape` reuse.

## Rules

- Harden adds cases; it doesn't redesign tests or features.
- Never harden by adding weak assertions — a boundary case with a truthiness assert is still
  untested (`strengthen` is the pair command).
