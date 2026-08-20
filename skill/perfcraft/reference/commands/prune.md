# Command: prune

Remove dead weight: dead code, unused dependencies, oversized assets, and caches that don't pay.
The only optimization that reduces complexity while improving speed — everything else trades one
for the other.

## The prune list

1. **Dead code** — unreachable functions, dead routes, feature-flagged-off forever paths. The
   bundle analyzer's unused-bytes report is the map (`domains/delivery.md`).
2. **Unused dependencies** — the package the tree-shaker can't save because it's imported for one
   function (`anti-patterns.md` D2); replace with a small module or hand-rolled code.
3. **Oversized assets** — images at 2× needed size, uncompressed, or duplicate formats; the
   largest-10 list from `measure` is the hit list.
4. **Over-fetching** — endpoints and queries shipping fields nobody renders; projection
   (`domains/data.md`).
5. **Caches without rent** — the cache with a 12% hit rate on a cold path (`cache`'s exit
   criteria); remove it, its invalidation code, and its bug surface.
6. **Duplicate work** — the same computation twice per request (recomputed values, repeated
   parsing); compute once, pass along.

## Steps

1. Build the candidate list from `measure`/`audit` output with evidence per candidate (size,
   hit rate, call count, unused report).
2. Get one confirmation on the list before deleting — pruning ships as a removal PR the team can
   review as such.
3. Delete in one batch; re-measure: bundle size, asset count, latency where it touched. Quote the
   deltas.
4. Record in PERF.md what was pruned and why — the memory of the pruning prevents the regrowth.

## Rules

- Prune by evidence, not instinct — a "probably unused" dependency gets verified (usage search)
  before it's cut.
- Never prune the critical path's optimization (the cache with rent stays; it's on the list by
  mistake only).
- One batch, one PR, reviewable as removals — pruning smuggled into feature work is how outages
  hide.

## Exit criteria

- Candidates resolved (removed or defended with a reason); before/after sizes and latencies
  quoted; PERF.md updated.
