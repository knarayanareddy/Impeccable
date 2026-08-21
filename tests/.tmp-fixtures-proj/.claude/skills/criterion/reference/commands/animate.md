# Command: animate

Add restrained, purposeful motion that serves task comprehension (domains/motion.md is the authority).
For interfaces that are static where state changes deserve to be seen.

## What earns motion in a tool

1. **Feedback on actions** — press states on controls, save/delete confirmations, optimistic-update
   resolutions (≤300ms, ease-out).
2. **Continuity of items** — row reorder/insert/remove, list→detail transitions, filter application
   (200–400ms, layout transitions with FLIP-style continuity).
3. **Attention to rare events** — a job failing, an alert firing (one calm pulse, then persistent state).

## Steps

1. Walk the target and list the state changes a user must perceive; mark which already have motion and
   which are silent.
2. For each silent change, choose the cheapest adequate pattern from the table in domains/motion.md.
3. Implement with compositor-only properties (opacity, transform); never animate layout properties
   directly; never `transition: all`; never bounce/elastic.
4. Verify: durations within bounds, `prefers-reduced-motion` collapses to ≤100ms opacity or none,
   motion never gates access to content, and no reflow happens mid-task.
5. Count what was added. If the list exceeds ~5 additions per surface, stop — you are decorating, not
   animating.

## Exit criteria

- Every added animation maps to a named comprehension job in a comment or brief.
- Reduced-motion verified; no >500ms task feedback; check.mjs clean.

## Rules

- Animate does not add micro-interaction "delight" (confetti, parallax) — that is the marketing register.
- If a state change is already perceivable instantly, it does not need animation. Skip it.
