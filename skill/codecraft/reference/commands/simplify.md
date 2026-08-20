# Command: simplify

Reduce complexity while preserving behavior exactly. The signature craft move. Load
`reference/quality-floor.md` before editing.

## The order of operations (always in this order)

1. **State the behavior contract** — what must not change: outputs, side effects, error behavior,
   API shape. Write it before the first edit.
2. **Delete first.** Dead branches, unused params, unreachable code, redundant checks, state that
   can be derived, variables that exist once (`domains/complexity.md`). The best simplification is
   the code that isn't there.
3. **Replace state with derivation.** Computed-once-then-cached booleans → derive at the point of
   use. Three state flags → one named enum/state.
4. **Make illegal states unrepresentable.** Union/enum types, non-nullable fields, validated
   constructors — the highest-leverage simplification in typed languages.
5. **Extract the detours** (`extract`), then **flatten the nesting** (`flatten`) — usually the same
   pass.
6. **Straighten the data flow.** Early returns, single return of a named result, no in-out
   parameters.
7. **Re-read the names** — simplification almost always changes a claim somewhere (`name`).

## Guardrails

- Behavior-preserving, always. If the simplified version can't pass the existing tests (or a
  recorded before/after on the same inputs), the simplification is wrong — revert, don't "fix" tests.
- Simplify the *confusing* part, not the part you like best. Target the reader's pain, not your
  aesthetic.
- If the simple version costs measured performance the feature needs, keep the complex version and
  write the receipt (`complexity.md`) — that is still simplification (of the reader's doubt).

## Exit criteria

- The contract verified: tests green / types clean / recorded behavior identical.
- check.mjs clean on the target; the metric that motivated the pass quoted before and after
  (e.g., "83 → 24 lines, depth 5 → 2").

## Rules

- One simplification thesis per pass. "Made it simpler" is not a thesis; "replaced four flags with
  one state enum" is.
- No feature changes smuggled into a simplify diff — that's how reviews die.
