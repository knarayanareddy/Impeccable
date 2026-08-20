# Command: densify

Raise information per viewport **without clutter** — the signature move of this skill, and the inverse
of marketing design. Density must never cost scanability; it usually improves it.

## The order of operations (always in this order)

1. **Remove chrome first.** Borders, backgrounds, shadows, icon tiles, decorative gradients — every
   container that isn't carrying information. Flat and hairline beats elevated and framed.
2. **Remove redundancy.** Duplicate labels, repeated units, charts that restate tables, the "View all"
   that leads to the same thing one click later.
3. **Compress spacing to the tier.** Take region padding to the tier's pair (e.g., 16/24), table cells to
   12/16 or 8/12, section gaps to 24/32. Never below 4px base; never merge different groups.
4. **Tighten type where the scale allows.** Section titles 18→15px, secondary content one step smaller,
   captions 12px — hierarchy via weight and position, not size (domains/typography.md).
5. **Re-encode wide content.** Long text → truncate-with-identity + tooltip; many statuses → 4-color
   system; stacked rows → two-line rows; repeated chips → count badge ("+3").
6. **Only then, if the job demands it**, drop the tier: comfortable → compact (36px rows, 8/12 cells).

## Guardrails

- The job-per-viewport statement is the acceptance test: count the rows/items visible above the fold
  before and after and report the delta.
- Never remove content the job needs, never shrink targets below the floor (44px primary), never drop
  contrast, never reflow mid-task.
- Screenshot desktop + mobile before/after and show both. If scanability got worse (say so and revert) —
  density without hierarchy is clutter.

## Exit criteria

- Above-fold item count improved and stated ("31 → 44 rows @1440").
- Five states intact; check.mjs clean; hierarchy visible in a 3-second glance.
