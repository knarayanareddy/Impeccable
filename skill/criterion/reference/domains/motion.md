# Domain: Motion

In product UI, motion exists for **comprehension**: it shows that something changed, where it went, and
what caused it. Motion that does not explain is decoration — cut it.

## The three jobs of motion in tools

1. **Feedback** — the interface confirms an action (press, save, delete). ≤300ms, subtle.
2. **Continuity** — items move between states (row → detail, filter → filtered list) so the user tracks
   them. Layout transitions with FLIP-style continuity, 200–400ms.
3. **Attention** — a rare, important event (a failing job, an overdue alert). Use once, then calm.

Everything else (ambient floaters, parallax, cursor-followers, marquees) is marketing motion and does
not belong in Command or Configure registers.

## Timing and easing

| Purpose | Duration | Easing |
|---|---|---|
| Hover/press feedback | 100–200ms | ease-out |
| Show/hide, tooltip, dropdown | 150–250ms | cubic-bezier(0.2, 0, 0, 1) |
| Layout reflow, row reorder | 200–400ms | spring or cubic-bezier(0.3, 0, 0.2, 1) |
| Page/section reveal | ≤400ms | ease-out |

- **Never** bounce, elastic, back, or overshoot easing in task feedback. It reads as a toy.
- **Never** `transition: all`. Transition the exact properties (opacity, transform) — compositor-only
  where possible; avoid animating layout properties (height, top, margin).
- Animation must never delay access: content is usable immediately; motion amplifies, it does not gate.

## Loading patterns (by predictability)

| Situation | Pattern |
|---|---|
| Predictable, <1s (favorite, checkbox, save) | Optimistic update, no spinner ever |
| Predictable, 1–3s (list refresh) | Skeleton that **preserves layout** (no reflow when data lands) |
| Unpredictable/expensive (report, export) | Progress with a real percent or a named stage |
| Data not yet loaded (new surface) | Skeleton matching the final layout |

Skeletons are for *layout stability*, not for show — a skeleton that reshapes on load is worse than none.

## Reduced motion

- Honor `prefers-reduced-motion: reduce` — collapse to opacity-only, ≤100ms, or none.
- Provide a visible alternative for anything conveyed by motion alone (a "Saved" status, a moved-row
  highlight).
- Autoplaying anything (carousels, tickers) needs a pause control and a reduced-motion stop.

## Micro-interactions that earn their place in tools

Pressed states on every control · count-up only where magnitude matters (money, totals) and ≤500ms ·
row highlight on insert/update · drag affordance that follows the pointer · a "toast→inline" pattern:
confirm transiently, but always leave a persistent state the user can find later.

## Bans (recap)

Bounce/elastic easing, `transition: all`, >500ms task feedback, spinner-only for sub-second ops,
confetti in task flows, autoplay without pause, motion gating content access.
