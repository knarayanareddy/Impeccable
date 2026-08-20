# Domain: Caching

Caching converts time into memory and correctness risk. The craft is the contract: what's cached,
how it's keyed, when it dies, and who invalidates it. Every cache ships with all four — or it
ships as a bug.

## The hierarchy (cheapest first)

| Layer | Cost | Use for |
|---|---|---|
| Compute once in-process (memoize, module constant) | ~free | Immutable, per-process truths |
| In-process cache (LRU, bounded) | memory | Hot, small, recomputable data |
| Distributed cache (Redis/memcached) | network, cheap | Shared hot data across instances |
| Database (indexes, materialized views) | the source | The durable layer (`dbcraft`) |
| CDN / edge | ~free delivery | Static + cacheable public responses |
| Browser cache (HTTP caching) | free | The best layer — nothing ships at all |

Each layer earns its place: cache the *measured* hot path at the cheapest layer that satisfies the
freshness contract (`anti-patterns.md` C3).

## The invalidation contract (non-negotiable)

For every cache, write four lines where it's introduced:
1. **Key** — the exact inputs that determine the output (hash of them, normalized).
2. **TTL** — how stale the data may be; from the product's freshness requirement, not a guess.
3. **Invalidation path** — what writes through/evicts on change (cache-aside delete, write-through,
   versioned keys).
4. **Staleness acceptance** — what the consumer experiences when the cache is stale, and that the
   product accepts it.

## The patterns

- **Cache-aside** (default): read-through on miss, delete-on-write. Simple; race window on
  concurrent miss + write — know it exists.
- **Write-through / write-behind**: consistency up, complexity up. Only when the contract demands.
- **TTL + jitter**: spread expirations to avoid the thundering herd when a hot key dies.
- **Negative caching**: cache "not found" briefly — the most common DoS is re-asking the same
  missing thing.
- **Stale-while-revalidate**: serve stale, refresh in the background — the tail-latency killer for
  reads.

## HTTP caching (the free layer)

- `Cache-Control` with real freshness on public/static responses; `ETag`/`If-None-Match` for
  revalidation (304s are the cheapest responses that exist).
- `private`/`no-store` on per-user data — caching the wrong thing is a privacy incident with a
  cache hit.

## The failure modes

- **Cache poisoning** (key too broad: one user's data served to all) — the worst cache bug; key
  discipline is security.
- **Cache stampede** (hot key expires, 1,000 misses hit the DB) — jitter + single-flight
  (`singleflight`-style request coalescing).
- **Stale reads shipped as truth** — the contract's TTL wasn't a product decision.

## Bans (recap)

Cache without a contract, memoize-the-cold-path, key-too-broad, stampede-prone expirations, no
single-flight, HTTP responses uncached or over-cached.
