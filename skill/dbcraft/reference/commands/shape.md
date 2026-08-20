# Command: shape

Model entities and relationships before writing DDL. Shape owns the modeling reasoning; `migrate`
owns the artifact.

## Steps

1. Restate the need as data statements: what facts must the system record, who writes them, who
   reads them, and how often. If the facts can't be listed, ask — never model a domain you can't
   state.
2. Inventory the nouns and their cardinalities (`domains/relationships.md`): users, orders, items…
   each with its relationships (1:1 / 1:N / N:M), its lifecycle (does it have states?), and its
   uniqueness facts (what must never duplicate?).
3. Decide per entity:
   - Key strategy (`domains/keys.md`): surrogate / UUID / ULID / natural — with the reason.
   - The columns and their types (`domains/types.md`): money as NUMERIC/integer, time as
     timestamptz, deliberate text sizes, status as enum/CHECK not booleans.
   - The constraints (`domains/constraints.md`): NOT NULL with documented nulls, UNIQUEs (including
     soft-delete handling), CHECKs, FKs with ON DELETE policies.
   - The access patterns → which columns the hot queries will filter/sort on (this becomes the
     index design in `index`).
4. Check the model against the ten-year test: a million rows, a fourth writer, a new consumer.
   Adjust now — DDL is cheap, migrations are not.
5. Deliver: entity/cardinality list, per-entity column+constraint table, the open decisions with
   recommendations. No DDL yet — wait for approval, then hand off to `migrate`.

## Rules

- Shape never writes DDL or migrations. It ends where migration authoring begins.
- Respect DATA.md conventions; a shape that violates them must say why.
- Every column in the model answers a named fact — if you can't name the fact, cut the column.
