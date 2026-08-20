# Command: optimize

Diagnose and fix UI performance: render, load, and interaction latency. Fast is a feature of product
UI — a dashboard that janks on scroll has failed its job.

## Steps

1. Measure first, profile second, fix third. Establish baselines with the available tools (DevTools
   Performance, Lighthouse, React Profiler, or equivalents in the stack).
2. Diagnose by class:
   - **Load:** bundle size, render-blocking resources, unoptimized images, font loading, waterfall shape.
   - **Render:** unnecessary re-renders, layout thrash (read-write interleaving), expensive CSS
     (blur, heavy shadows, `transition: all`), long style/layout/paint tasks.
   - **Interaction:** input latency, jank on scroll/resize (non-composited properties animating),
     heavy event handlers (scroll/resize/mousemove without rAF/debounce).
   - **Data:** over-fetching, no pagination/windowing for long lists, chart redraws on every data tick,
     unbounded tables.
3. Fix in impact order, smallest risk first: image formats/sizes, code-splitting, virtualized lists,
   memoization where measured (not everywhere), compositor-only animation, indexed data lookups.
4. Verify each fix against the baseline: report before/after numbers (LCP, INP, re-render count, frame
   drops) — a fix without a number is a claim.

## Guardrails

- Optimize never changes behavior or visuals (no layout shifts from skeleton-to-content, no dropped
  features, no invisible states).
- Premature optimization is a defect too: don't memoize cold paths, don't virtualize a 20-row list.

## Exit criteria

- Before/after numbers for every fix; the target's interaction stays ≥60fps on the reference device;
  no layout thrash in the profile.
