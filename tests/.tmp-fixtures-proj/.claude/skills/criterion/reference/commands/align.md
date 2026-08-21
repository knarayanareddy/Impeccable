# Command: align

Fix spacing, alignment, and vertical rhythm to the 4px grid. The most common defect class in AI-
generated UI: values that are *close* but not *on*.

## Steps

1. Measure first (see `measure`): inventory the spacing values in the target's computed styles.
2. Classify each value: on-grid / off-grid orphan (3, 5, 7, 13...) / inconsistent pair (12 top, 16
   bottom) / unpaired (a one-off that should match a sibling).
3. Build the fix map against the surface's tokens (regions 16/24, cards 16, cells per tier, fields
   8/12 — domains/spatial.md). Snap each value to the nearest grid step, but decide per *role*, not per
   number: two elements in the same role get the same pair.
4. Fix alignment law violations in the same pass: numbers right-aligned + tabular, headers over their
   data, controls on a shared edge, icons on the label's optical line, nothing center-aligned in data
   regions.
5. Check vertical rhythm: equal row heights, one button height per size class, section gaps consistent.

## Exit criteria

- Every spacing value on the 4px grid and consistent per role.
- Alignment law holds in screenshots (desktop + mobile).
- No visual regression outside the target: align only moves things onto the grid, it never reflows layout structure.

## Rules

- If a value is off-grid for a reason (optical correction on an icon, baseline alignment), document it
  in a code comment or the surface brief — intentionality, not orphanhood.
- Align does not redesign. Same layout, snapped to the grid.
