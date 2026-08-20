# Domain: Relationships

How entities relate is the heart of modeling. Get the cardinalities right and the schema writes
itself; get them wrong and every query pays.

## The cardinality table

| Cardinality | Shape |
|---|---|
| 1:1 | FK with UNIQUE on the child side (or same table, `spouse_id UNIQUE`) |
| 1:N | FK on the many side (`orders.user_id → users.id`) |
| N:M | Join table with composite PK (`order_items(order_id, item_id)`) + FKs to both sides |
| Self-referential | FK to the same table (`employees.manager_id`) — trees get the treatment below |

## Modeling rules

- **The FK lives on the many side.** A list (`user_ids BIGINT[]` on the parent) breaks every join,
  constraint, and index the engine has. One row per fact.
- **Join tables are first-class tables**, not afterthoughts: they carry their own columns (quantity,
  added_at), their composite PK, and their own indexes — including the reverse lookup index
  (`INDEX (item_id)`) which the composite PK alone doesn't cover.
- **Polymorphic associations are fiction** (`owner_type` + `owner_id`): no FK is possible, so
  integrity is a rumor. Replace with per-owner join tables, or a shared supertype table
  (`resource` with `image.resource_id`), or separate columns per type where the type set is closed.
- **Trees and graphs:**
  - Adjacency list (`parent_id`) — simplest, fine for shallow reads; deep traversal needs a
    recursive CTE (and the planner must be checked — this is where naive queries die).
  - Closure table — the general-purpose answer for deep/aggregate tree queries, at the cost of
    maintaining a path table.
  - `ltree` / nested sets — specialized; adopt only with a measured reason.
  - Pick based on the *read patterns* (who asks "all descendants?" how often?), not the write
    convenience.

## Referential integrity in the real world

- **Cascades are contracts.** `ON DELETE CASCADE` on `order_items.order_id` says "an order owns its
  items, and their fate is the order's fate." Write the policy per relationship (`constraints.md`).
- **Soft deletes complicate every relationship** — a soft-deleted parent with living children is a
  state the schema must model (deletion state on the parent, cascade the *state*, not the rows).

## EAV and the anti-pattern zone

`entity_id / attribute / value` tables (`anti-patterns.md` M1) are the model's surrender: no types,
no constraints, no indexing strategy, unreadable queries. When the shape varies:
- A fixed set of optional attributes → real nullable columns.
- Truly varying per-row data → JSONB (and stop querying inside it).
- Consumer-defined schemas (a platform lets users define fields) → a real metadata model with a
  separate, constrained storage design — designed, not defaulted.

## Bans (recap)

Polymorphic associations, EAV, arrays-of-FKs, orphan-able children with no policy, soft-delete
designs that break uniqueness silently, tree models picked without the read patterns.
