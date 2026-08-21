# Command: distill

Strip the surface to its essence: remove complexity, redundancy, and decoration that has accumulated.
The inverse of `densify` in spirit — distill is subtractive even where density is not the goal.

## What to cut, in order

1. **Features nobody uses on this surface.** Controls, columns, tabs, and links that don't serve one of
   the three most frequent jobs. Move them behind "more" or to a secondary surface; delete only with
   user confirmation.
2. **Decorative elements.** Gradients, shadows, icon tiles, dividers that don't separate, colors that
   encode nothing (domains/color.md: every color earns its meaning).
3. **Redundant paths.** Two ways to the same action → keep the one on the dominant path. Duplicated
   summary widgets → one source of truth per question (domains/data-display.md).
4. **Copy.** Every string either instructs, labels, or states — else it goes. Headings become findings.
5. **Config surfaces.** Defaults that 90% never change → presets + "advanced" (collapsed).

## Method

1. List the three most frequent jobs from PRODUCT.md (or state them from the brief).
2. Walk every element and ask: does this serve one of the three jobs, or the task's safety? No → cut
   list.
3. Get one confirmation on the cut list before editing; then remove in one batch.
4. Re-test all five states after cutting — distillation frequently orphans an empty state.

## Exit criteria

- The surface answers one question per region; nothing decorative survives that can't name its job.
- The three frequent jobs complete in fewer steps than before (count them).
- Screenshot before/after; state what was removed and why.

## Rules

- Distill removes; it never re-architects. If the surface's IA itself is wrong, that's `shape`/`new-work`.
- Never cut accessibility affordances or the five states — they are not "complexity".
