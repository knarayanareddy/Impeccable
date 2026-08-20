# Case study: the generic AI performance → the perfcraft pass

A before/after case study driven by the deterministic checker and the budget gate — the
measured transformation, plus the gate that keeps it true.

## The before

A typical AI-generated checkout path (`demos/perfcraft/before.js`): sync I/O in the handler
(`readFileSync`), an N+1 loop (two queries per order), a busy retry spin
(`while (true) { fetch() }`), `SELECT *`, an unbounded load, O(n²) string building, and deep
clones per row.

The checker's verdict (`node skill/perfcraft/scripts/check.mjs --strict`):

```
ERROR sync-io          before.js:8   fs.readFileSync(
ERROR busy-retry       before.js:22  while (true) without backoff
WARN  n-plus-one       before.js:12  loop + per-item query (×2)
WARN  select-star      before.js:12  SELECT *
WARN  unbounded-load   before.js:30  db.find()
WARN  string-concat-loop before.js:18  += in loop
WARN  deep-clone       before.js:13  JSON.parse(JSON.stringify(...))

perfcraft: 1 file(s) scanned · 2 error(s), 8 warning(s) · FAILED
```

## The pass

One perfcraft pass — `optimize` (batch the queries, project the columns, cap the page),
`defer`/`harden` (async config, backoff+jitter retry with a max), `prune` (the deep clone →
structural sharing, the concat → builder) — produces `demos/perfcraft/after.js`.

The checker also taught the *author*: the first "after" draft's bounded retry loop was
flagged as N+1 and string-concat — legitimate precision gaps in the checker, fixed and
pinned (`bounded retry loops are retries, not data iteration`).

```
perfcraft: 1 file(s) scanned · 0 error(s), 0 warning(s) · clean ✓
```

## The budget gate, demonstrated

`node skill/perfcraft/scripts/budget-check.mjs` applies the budget file to two measurements —
over budget fails with the numbers (`script: 310KB > budget 200KB`, `LCP: 2700 > 2500ms`),
under budget passes. The demo runner shows both, and the gate's shape rule fires on any
budget whose metric lacks a percentile — a budget without a percentile is a wish.

## The claim

The transformation is verifiable in both directions, and the budget is a *gate*, not a
document. Performance craft with a receipt.
