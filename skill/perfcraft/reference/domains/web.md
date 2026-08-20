# Domain: Web performance

The browser is where the user's clock lives. Server speed matters exactly as much as it surfaces in
the browser.

## The vitals (what to track and gate)

| Metric | The question | Healthy budget |
|---|---|---|
| **LCP** (Largest Contentful Paint) | When did the main content arrive? | < 2.5s (p75) |
| **INP** (Interaction to Next Paint) | How long until the page responds to a tap/click? | < 200ms (p75) |
| **CLS** (Cumulative Layout Shift) | Did the page jump while loading? | < 0.1 |
| TTFB | Time to first byte — the server + network slice | < 800ms |
| TBT / long tasks | Main-thread blockage (INP's engine room) | minimal; no >50ms tasks |

Measure with **RUM** (real user monitoring) for the truth, lab tools (Lighthouse) for the
reproducible gate — both, not either.

## The critical rendering path

1. **HTML arrives fast** (TTFB): edge/CDN, streaming, no blocking render.
2. **Nothing render-blocking** that isn't essential: CSS inlined for above-the-fold, JS deferred
   (`defer`/`async`/dynamic import), fonts `font-display: swap`.
3. **LCP element early and unblocked**: preload the hero image, no lazy-load on the LCP element,
   `fetchpriority="high"` where it counts.
4. **Main thread stays free** (`domains/concurrency.md`): heavy work off the main thread, split
   long tasks, no layout thrash (`anti-patterns.md` B3).

## Payload discipline

- **Images** (`domains/delivery.md`): right format (AVIF/WebP), right size (srcset), lazy below the
  fold, width/height to reserve layout (CLS).
- **JS**: code-split per route/feature, dynamic import for the rare path, tree-shake, no vendor
  bloat (`anti-patterns.md` D2). The unused kilobyte is the most expensive one.
- **Fonts**: subset, preload the critical weights, `font-display: swap`, no layout-shifting
  fallbacks.

## Perceived performance (the user's clock, again)

- **Skeleton beats spinner** for predictable loads — preserve layout, then fill it
  (`anti-patterns.md` D4).
- **Streaming and progressive rendering**: show the shell and the first content while the rest
  streams in.
- **Optimistic UI** for predictable sub-second writes: apply locally, reconcile, roll back visibly
  on failure.
- **Interaction feedback < 100ms**: press states, immediate toggles — perceived speed is feedback
  speed (`criterion`'s motion domain agrees).

## Bans (recap)

Render-blocking everything, un-optimized heroes, layout shift from late media, spinner-for-
everything, long main-thread tasks, vendor bloat, vitals measured only in labs.
