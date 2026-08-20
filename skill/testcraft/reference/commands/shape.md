# Command: shape

Plan the test strategy before writing code: the case inventory, assigned to levels. Shape owns the
testing reasoning; `scaffold` owns the skeleton.

## Steps

1. Restate the feature's contract: the observable behaviors — inputs, outputs, state changes,
   errors, and the forbidden transitions. From the spec or the code's public interface, never from
   the internals.
2. Build the case inventory (`domains/cases.md`): happy path, boundaries, error paths, states,
   concurrency (where real), plus the regression pins for any related production bugs.
3. Assign each case to the cheapest level that can prove it (`domains/e2e.md`):
   - Pure logic → unit
   - Real seam (DB, HTTP, codec) → integration
   - Cross-system journey → E2E
4. Decide the fakes and seams per case (`domains/fakes.md`): what gets doubled, what stays real.
5. Estimate the budget: counts per level and expected durations — check them against TESTS.md's
   pyramid policy and say where they deviate.
6. Deliver the case table (case | input | expected outcome | level | why it matters) and wait for
   approval before scaffolding.

## Rules

- Shape never writes test code. It ends where `scaffold` begins.
- Every case names an observable outcome — "it doesn't crash" is not a case.
- Flag the gaps honestly: a behavior with no boundary or error cases is an incomplete plan, and the
  plan says so.
