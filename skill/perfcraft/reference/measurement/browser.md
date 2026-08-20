# Measurement sheet: Browser

Loaded with `domains/web.md` when the surface is the browser. The domains say *what* to
measure; this sheet says *how* in this environment.

## Lab vs field (both, always)

- **Lab** (Lighthouse / Lighthouse CI): the reproducible gate — run on throttled profiles
  (mobile-class CPU/network), per route, in CI via the budget-check gate.
- **Field** (RUM): the truth — LCP/INP/CLS at p75/p95 per device class, from real users.
  Lab regressions gate the change; field regressions gate the release.

## The instruments

| Question | Instrument |
|---|---|
| Where does the load time go? | Lighthouse trace view (LCP sub-parts: TTFB / load delay / load duration / render delay) |
| What blocks the main thread? | DevTools Performance → long tasks; INP's attribution view for interaction lag |
| Why does layout shift? | Layout-shift region trace (CLS's culprit elements) |
| What's in the bundle? | Bundle analyzer (source-map explorer / webpack-bundle-analyzer) — the unused-bytes report |
| What do real users feel? | web-vitals in the app → the RUM provider |

## The workflow

1. Reproduce in lab first (the failing route, throttled); capture the trace.
2. Attribute with the sub-parts (LCP) or the long-task profile (INP) — the largest part is
   the fix target (`domains/web.md`'s attribution table).
3. Fix one thing; re-run the same lab config; quote before/after with the throttle profile
   named.
4. Gate: write the budget file, wire budget-check + Lighthouse CI into the pipeline
   (`budget`'s doctrine).

## Bans

Lab-only conclusions about real users · un-throttled "fast on my laptop" numbers · INP
attribution skipped · budget gates that notify instead of block.
