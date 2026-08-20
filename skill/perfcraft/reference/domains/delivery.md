# Domain: Delivery (assets & payload)

Delivery is the part of performance the user pays first: every byte must cross the network before
any of the other domains matter. The discipline: ship the smallest thing that does the job, once.

## Size budgets by asset class

| Asset | The discipline |
|---|---|
| Images | Right format (AVIF/WebP, PNG only for transparency needs), right dimensions (srcset, no 2× oversize), compressed, lazy below the fold, `width`/`height` to reserve layout |
| JavaScript | Route/feature code-splitting, tree-shaking, dynamic `import()` for the rare path, no vendor bloat, minified + compressed (gzip/brotli) |
| CSS | Split critical/non-critical, purge unused, minify |
| Fonts | Subset to the used glyphs, preload the critical weights, `font-display: swap` |
| Everything | Compress (brotli > gzip), correct cache headers (`domains/caching.md`), CDN/edge for static |

## The delivery rules

- **The critical path gets priority** — preload what LCP needs, defer what it doesn't
  (`domains/web.md`); `fetchpriority` where the browser needs the hint.
- **One request beats ten small ones** for latency-bound payloads (bundling, sprites, HTTP/2
  multiplexing changes the calculus — measure per case); **ten small ones beat one huge one** for
  cacheability (code-split so the changed chunk invalidates only itself).
- **The bundle budget is a budget** (`budget`): total JS ≤ some kB on the critical route, gated in
  CI — bundle size is the only delivery metric that regresses silently and is cheap to gate.
- **Progressive enhancement of delivery**: streaming HTML, SSR/SSG where the first paint demands
  it, hydration that defers until interaction (islands).

## Auditing delivery (`audit` + `measure`)

- The waterfall (what loads when, what blocks what).
- The payload breakdown by asset class (images usually win the bloat contest).
- The unused-bytes report (bundle analyzer / coverage): shipped-but-never-run code is pure tax.
- Real-user transfer sizes (RUM), not just lab numbers — the network is part of the product.

## Bans (recap)

Megabyte heroes, one-function vendor libraries, un-split routes, uncached static, uncompressed
text, un-subset fonts, unused bytes shipped with confidence.
