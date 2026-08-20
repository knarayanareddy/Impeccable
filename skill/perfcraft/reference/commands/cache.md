# Command: cache

Add caching where it pays — with the invalidation contract (`domains/caching.md` is the
authority). The most common "optimization" and the most common bug factory: the contract is the
entire craft.

## The gate (before any cache)

1. **Measured hot path** — the profile names the recomputation as the cost (`perf-floor.md` #1).
2. **Recomputable** — the data can be rebuilt when stale; cacheable truth only.
3. **Freshness known** — the product states how stale the data may be; that becomes the TTL.
4. **Keyable** — the inputs that determine the output can be normalized into a key.

## Steps

1. Choose the layer from the hierarchy (in-process → distributed → CDN/HTTP — `domains/caching.md`)
   — the cheapest that satisfies the freshness contract.
2. Write the **invalidation contract** where the cache is introduced (four lines, non-negotiable):
   - Key — the exact normalized inputs.
   - TTL — from the product's freshness requirement, not a guess.
   - Invalidation path — what deletes/refreshes on write (cache-aside delete, write-through,
     versioned keys).
   - Staleness acceptance — what the consumer sees when stale, accepted by the product.
3. Guard the failure modes in the same change:
   - Stampede → TTL jitter + single-flight coalescing.
   - Poisoning → key includes every varying input (tenant, user, locale, authz context).
   - Unbounded growth → every in-process cache is bounded (max entries/bytes + eviction).
4. Measure: hit rate, and the before/after latency on the target path. A cache that doesn't move
   the number gets removed — caches pay rent or leave.

## Rules

- Never cache the cold path ("memoize everything" is a memory tax, not an optimization).
- Never cache without the four-line contract — a cache without invalidation is a bug with a timer
  (`perf-floor.md` #8).
- Never cache per-user data with a shared key — that's a privacy incident with a cache hit.

## Exit criteria

- Contract written, failure modes guarded, hit rate and latency quoted before/after, the cache's
  rent documented in PERF.md.
