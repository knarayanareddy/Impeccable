# Domain: Normalization

Normalization is the discipline of storing each fact exactly once. It is the default, not the
religion — the craft is knowing when (and how) to stop.

## The forms, practically

- **1NF — atomicity:** no repeating groups, no arrays-of-values in a column, no CSV in a string.
  One cell, one fact. (JSONB payloads are the deliberate exception, not a 1NF dodge.)
- **2NF — no partial dependencies:** in a composite-key table, every non-key column depends on the
  *whole* key, not part of it. (`order_items`: `item_name` depends on `item_id`, not on the
  `(order_id, item_id)` pair → it belongs in `items`.)
- **3NF — no transitive dependencies:** non-key columns depend on the key, not on other non-key
  columns. (`orders.customer_name` depends on `customer_id` → belongs in `customers`.)
- **BCNF and beyond:** edge cases where a non-key column determines a key column — fix when the
  anomaly shows, don't chase the textbook.

## The payoff, stated honestly

Normalization buys: one place to update, no update anomalies, no insert anomalies (can't record a
customer without an order), smaller rows, one source of truth. It costs: joins. The join cost is
real but usually overestimated — with indexed keys, joins are the engine's home turf. **Normalize
first; denormalize when a measured plan says the join actually hurts.**

## How to run a normalization pass (`normalize`)

1. List the functional dependencies per table (what determines what).
2. Find violations: partial dependencies, transitive dependencies, repeating groups.
3. Fix via migration, expand/contract style: add the new table, backfill, dual-write briefly,
   switch reads, drop the old column later — never a destructive one-step rewrite
   (`domains/migrations.md`).
4. Every split table gets its FK, its index, and its ON DELETE policy in the same migration.

## Deliberate denormalization (the contract)

Denormalization is allowed when ALL hold:
- A query was **measured** (plan + latency) and the join is the bottleneck — not guessed.
- The duplicated data has a **named writer** (one code path owns it) and a **reconciliation job**
  (backfill/verify script) — stated in the schema comment or data dictionary.
- The staleness window is **documented and acceptable** to the product.
Otherwise: don't. Two copies of the truth will drift, and the drift will be found by a customer.

Common legitimate denormalizations: cached aggregates (`orders_count` on `customers`, updated by a
counter/trigger), snapshot copies (invoice line items copied from products — historical truth, not
drift), search/facet tables.

## Bans (recap)

Repeating groups, CSV columns, transitive dependencies left in place "for performance" without a
measurement, denormalization without a named writer + reconciliation job, one-step destructive
splits.
