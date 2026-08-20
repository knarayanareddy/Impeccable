# Command: extract

Pull a function, type, or module out of a larger one. The universal de-risking move: extraction is
behavior-preserving by construction.

## Steps

1. Confirm the target: a region of a function that is one job, a type hiding inside a file, or a
   module hiding inside a grab-bag.
2. State the behavior contract of the region: inputs, outputs, side effects, and what it reads from
   the surrounding scope (locals, fields, globals).
3. Identify the closure: the variables the extracted piece needs. Pass them as parameters (max 3–4)
   or bundle them into a named struct/object — no sneaky access to the parent scope beyond the
   platform's norms.
4. Name the new unit with one precise verb+noun (`naming.md`); if you cannot name it, it isn't one
   job — re-slice.
5. Move the code; in the origin, replace the region with the call. No other edits. The diff must
   read "moved, then called."
6. Verify: run the existing tests / types / formatter, then `check.mjs`. If anything changed
   behaviorally, the closure was wrong — fix the extraction, not the tests.

## Rules

- Extraction is mechanical. Refactoring opportunities *inside* the extracted code are a follow-up
  pass, never smuggled in.
- One extraction per pass; a PR that extracts six things is unreviewable.
- Do not extract one-liners or trivial blocks unless they encode knowledge (a named condition like
  `isSettlementDay(date)` earns its existence even at two lines).
