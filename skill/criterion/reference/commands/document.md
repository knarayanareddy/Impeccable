# Command: document

Generate DESIGN.md from existing project code. The complement of init: init asks, document
reads. For incumbent projects that never wrote their design decisions down.

## Steps

1. Inspect the incumbent visual truth from the code: tokens, CSS variables, theme config, fonts,
   spacing, radius, colors — the actual values, not screenshots alone.
2. Extract the current decisions: type scale in use, semantic colors with their contrast pairs,
   spacing scale and pairs, radius values, density tier per surface, and the one signature
   element or behavior.
3. Note the inconsistencies honestly: same meaning with multiple values; banned patterns present
   (run `scripts/check.mjs` and record its findings); conventions that drift per surface.
4. Record the accessibility state too: focus-visible styles, reduced-motion support, label
   wiring, and the WCAG contrast floor as actually implemented — a11y is part of the incumbent
   truth, not an addendum.
4. Write DESIGN.md at the project root (or `.criterion/DESIGN.md` if the root is crowded),
   following `assets/DESIGN.example.md`'s shape.
5. End with the gap list: what `align` / `typeset` / `polish` should converge later.

## Rules

- Document records the incumbent world; it never invents one. Zero UI edits in this command.
- The output is the incumbent truth — including its flaws, marked as findings, not silently
  cleaned.
