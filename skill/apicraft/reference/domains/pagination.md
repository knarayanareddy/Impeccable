# Domain: Pagination

Every collection endpoint paginates. The only question is whether it paginates *well* — and
unbounded or unstable pagination is how data APIs quietly corrupt their consumers' data.

## Cursor vs offset

- **Cursor-based (default for APIs):** `GET /orders?limit=50&cursor=eyJ...` → `{items: [...], next_cursor, has_more}`.
  Stable under inserts/deletes, efficient at depth, resumable. The cursor is opaque — an encoded
  position, never an id the consumer parses.
- **Offset-based (only when the UI needs it):** page numbers, jump-to-page, total counts. Accept
  duplicate/skipped rows under concurrent writes; document it. `page` + `limit` together, never
  `page` alone.
- Hybrid (`page` + `cursor` for deep pages) when you must have both — at the cost of explaining both.

## The rules

1. **Limit is capped.** Default 20–50; max 100–500; documented in the spec and enforced in code.
   `?limit=100000` must return the cap (or 422), never the 100,000 rows (`anti-patterns.md` C2).
2. **Ordering is stable and stated.** The default sort is documented; `sort` accepts an allowlist of
   fields + direction (`sort=-created`), never arbitrary SQL. Ties broken deterministically (id as
   final key).
3. **`has_more` beats `total`.** Counting is expensive and usually unneeded; `has_more` (or
   `next_cursor: null`) is enough for 90% of UIs. Offer `total` (or `X-Total-Count`) only where the
   product needs it, and say it's approximate if it is.
4. **Pagination state is a snapshot.** The cursor pins the position as of the request; new rows don't
   shift it. Document that.

## Filtering — one vocabulary

- Named filters with documented operators: `?status=open`, `?created[gte]=2026-01-01T00:00:00Z`,
  `?customer_id=42`. One convention for ranges (`gte`/`lte`), lists (`in`), and text (`contains`).
- Free-text search gets its own parameter (`q` or `search`) with *stated* semantics (which fields it
  searches, how it ranks) — never an undocumented catch-all.
- Filters are combinable with AND by default; OR, when needed, is explicit (`?status=open,closed`
  for OR-in-field).
- Filtered-out counts: a filtered empty result says "0 results for status=open" and offers the
  clear-filters affordance — the API mirrors this by returning the applied filters in `meta`.

## Sorting & expansion

- Sort keys from an allowlist only; each documented (type-aware: dates as dates, not strings).
- `expand`/`include` for related resources (`?expand=items`), allowlisted, with documented limits
  (depth, count) — never unbounded graph loading.

## Bans (recap)

Unbounded limits, offset-only at depth, unstable default ordering, arbitrary sort keys, invented
filter vocabulary per endpoint, undocumented search semantics, total-count-everywhere.
