# Command: polish

The final pre-ship pass. Everything already works; polish makes it feel finished. Load
`reference/craft-floor.md` before editing.

## Scope

1. **Alignment & grid** — fix off-grid spacing, inconsistent pairs, orphaned values.
2. **Type** — scale adherence, tabular figures on all data, units in headers, truncation with identity.
3. **Color** — semantic token usage; kill raw hexes that duplicate tokens; contrast-check the stragglers.
4. **States** — any region missing one of the five states gets it now (small, focused implementations).
5. **Copy** — button verbs, error formats, empty-state actions; kill exclamation marks and lorem remnants.
6. **Motion** — cut >500ms feedback, elastic easing, `transition: all`; respect reduced motion.
7. **Consistency** — same control, same place, same behavior across the surface; one primary action per region.

## Method

1. Screenshot the surface (desktop + mobile) — work from the screenshots, not the code.
2. Build the fix list from the screenshots + `check.mjs` output; fix in **one batch**.
3. Re-screenshot, confirm with at most one more round. Stop. Polish is bounded.

## Exit criteria

- `check.mjs` returns clean on the target.
- Every craft-floor item verifiable from screenshots.
- Zero placeholder copy shipped; zero invented data.

## Rules

- Polish preserves identity and behavior. No redesign sneaking in — if the user wants a new world, that's `new-work`, not polish.
- No new features during polish. A polish PR that adds a feature has failed its job.
