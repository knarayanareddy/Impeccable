# Command: align

Align the target with codebase conventions and its neighbors' style. The least glamorous craft move
and one of the most valuable: consistency is a reader accelerator.

## Steps

1. Establish the local truth: read CODEBASE.md (if present), the formatter/linter config, and 2–3
   neighboring files in the same layer. The convention is what the codebase *does*, not what a style
   guide *says*.
2. Inventory the target's deviations:
   - Naming: two words for one concept, one word for two (`naming.md`).
   - Structure: file/module layout differing from siblings (`structure.md`).
   - Style: quotes, semicolons, imports order, error idiom, async style (`idioms.md`).
   - Shape: function/parameter conventions of the layer (`functions.md`).
3. Fix by the local truth, in one mechanical batch — this diff should look boring.
4. Where the codebase itself is inconsistent, pick the *dominant* convention and state the choice in
   the report (and offer to record it in CODEBASE.md) — don't silently invent a third style.
5. Verify: tests/types green, formatter/linter (if any) clean, and the target now reads like it was
   written by the same hand as its neighbors.

## Rules

- Align does not impose external style. Imported taste ("Google style says...") loses to the
  codebase's own accent every time.
- Never align by rewriting whole files — deviation-by-deviation edits keep the diff reviewable.
- Behavior untouched; a style-only diff that changes semantics is a bug.
