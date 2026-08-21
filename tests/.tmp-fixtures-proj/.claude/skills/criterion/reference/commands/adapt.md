# Command: adapt

Adapt the target for different devices, screen sizes, and input modes — with the data view treated as
the hard part, because it is.

## Steps

1. Define the width classes: 320–479 (phone), 480–767 (large phone), 768–1023 (tablet), 1024–1279
   (small desktop), 1280+ (desktop). Test at 320 / 375 / 768 / 1280 minimum.
2. **Data views first** — the strategy for tables/lists per width:
   - Column priority: name which columns survive at each class (identity columns first, actions last).
   - Collapse: table → card list at <768 when rows have few comparable columns; keep the table when
     comparison *is* the job and give it horizontal scroll + frozen identity column instead.
   - Controls: filters collapse behind a button with applied-chip summary; pagination becomes
     infinite/load-more with restore-position.
   - Charts: simplify at narrow widths (fewer ticks, larger direct labels), never shrink-to-illegible.
3. **Touch:** targets ≥44px, hover-only content gets a touch path, spacing ≥8px between targets.
4. **Input modes:** keyboard intact at every class; focus order matches visual order.
5. **Density shift:** compact tier may be the mobile tier (more rows per screen) — but never below
   readable cell padding (8/12).
6. Verify no page-level horizontal scroll at 320; internal scroll allowed inside data regions.

## Exit criteria

- 320 / 375 / 768 / 1280 screenshots with the job-per-viewport statement true at each class.
- Data identity always visible during horizontal scroll (frozen column or repeated key).

## Rules

- Adapt keeps the same information hierarchy — it re-encodes it, never deletes columns silently.
  Column removals get the user's confirmation when the job depends on them.
- Native platforms: translate to platform adaptivity (split view, landscape, dynamic type) instead of
  CSS breakpoints; same principles.
