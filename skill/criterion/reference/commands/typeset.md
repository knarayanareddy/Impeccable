# Command: typeset

Fix font choices, hierarchy, sizing, and data figures (domains/typography.md is the authority).

## Steps

1. Inventory the type in use: families, sizes, weights, line-heights per role; where data appears,
   check `tabular-nums`.
2. Fix the family decision first: if the stack is a banned default (Inter/Roboto/Arial/Open Sans...)
   chosen silently, replace with a deliberate workhorse that supports the project's languages and
   figures — or keep it and *state the reason* in DESIGN.md. A decision recorded beats a font swapped.
3. Rebuild the scale: ≤6 sizes, roles mapped (page title, section, body/cell, dense data, caption).
   Hierarchy via weight and position before size (domains/typography.md).
4. Fix data type: tabular figures on every numeric column, KPI, and chart label; right-aligned numbers;
   units in headers; consistent decimals; one date format.
5. Truncation pass: ellipsis with identity preserved, tooltips for full values, no silent hiding.
6. Line-height pass: 1.4–1.5 for cells/labels; never below 1.3 on data.

## Exit criteria

- The scale is defined in tokens and the surface uses only it.
- Every data value tabular and aligned.
- Screenshot comparison: same content, visibly calmer hierarchy.

## Rules

- Typeset is not a rebrand — it keeps the incumbent look, tuned. A new type world is `new-work`.
- Respect loaded webfonts: don't add new fonts without checking bundle cost (report it if you do).
