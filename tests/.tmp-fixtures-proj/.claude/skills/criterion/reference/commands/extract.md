# Command: extract

Pull reusable tokens and components from existing code into a design system. For projects that grew
without one.

## Steps

1. Inventory actual usage: find the most-repeated raw values — colors (hex/rgb), font stacks, radii,
   spacing, and repeated component patterns (buttons, tables, badges, cards, form fields). Use grep /
   the CSS files, not memory.
2. Cluster into candidates: group identical and near-identical values (same hex, 1px-off radii,
   font-family lists differing by one fallback). The clusters are the truth; the code's inconsistencies
   are the defects.
3. Propose the token set per the domain files: semantic color roles with contrast-checked pairs
   (domains/color.md), functional type scale with tabular figures (domains/typography.md), 4px spacing
   pairs and radius ≤2 values (domains/spatial.md).
4. Map clusters → tokens and list conflicts: places where one meaning uses three hexes. Ask the user to
   resolve meaning conflicts (which value is the intended one) rather than guessing — then record in
   DESIGN.md.
5. Extract components only where they repeat ≥3 times and behave identically: Button, Badge, Table,
   Card/Panel, Input/Field, Toast/Alert. Document props, states, and the density tier of each.
6. Implement as the project's stack allows: CSS custom properties / Tailwind theme / design-system
   package. Do **not** rewrite every usage in one pass — extract tokens first, migrate the highest-
   traffic surfaces, leave the rest to later commands (`align`, `polish`).

## Rules

- Never invent values that don't exist in the code; the design system must be the code's truth,
  reconciled.
- Preserve behavior exactly: extraction is not redesign. Visual diffs must be zero except resolved
  inconsistencies.
- Deliver: DESIGN.md (tokens + component inventory), the token implementation, and a migration list
  with the 3 surfaces to migrate first.
