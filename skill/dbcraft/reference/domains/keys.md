# Domain: Keys

Keys are identity. Every table needs one; every relationship hangs off one. Bad key choices are the
least reversible decisions in the whole schema.

## Primary keys

- **Surrogate by default:** `BIGINT GENERATED ALWAYS AS IDENTITY` (Postgres) / `AUTO_INCREMENT`
  (MySQL) — fast, compact, stable, never carries meaning.
- **UUID v4** where rows are created across systems or must be unguessable; **ULID** when you also
  want time-ordered sortability (feeds, streams).
- **Natural keys only when truly stable:** ISO country codes, currency codes. Emails, usernames, and
  phone numbers are *not* stable — they change and get recycled; make them UNIQUE columns, not keys.
- **Composite keys when the combination is the identity** (join tables: `(order_id, item_id)`; event
  sourcing streams). The composite key *is* the domain statement.
- Never expose auto-increment values as business identity where volume is sensitive — competitors
  read your growth from your IDs.

## Foreign keys

- Name the convention: `{referenced_table}_id` (`user_id`, `order_id`). One name per concept
  (`align`).
- Type must match the referenced key exactly (BIGINT → BIGINT, UUID → UUID) — mismatched FK types
  are a silent performance killer (implicit casts defeat indexes).
- **Every FK column gets an index** (`domains/indexes.md` #1) — the cascade, the join, and the
  orphan check all need it.
- The ON DELETE policy is part of the key decision (`domains/constraints.md` #4).

## Uniqueness

- Every real-world uniqueness becomes a UNIQUE constraint: emails (citext or lower-index), slugs per
  owner (composite unique), codes per type.
- **Soft deletes break naive uniqueness** — handle explicitly: partial unique index excluding
  deleted rows, or a `deleted_at` + `unique_violation` retry with tombstone, or a separate
  `deleted_users` table (`anti-patterns.md` M5).
- Case and whitespace: normalize (`lower(email)`) via generated column or functional index — the
  constraint must match how the business thinks uniqueness works.

## Key hygiene

- Keys are immutable. Changing a primary key means rewriting every FK and every consumer — the most
  expensive migration that exists. Choose once, deliberately.
- No nullable unique "keys" pretending to be identity (a nullable unique column is a rule with a
  hole).
- Surrogate + natural pair: the surrogate is the key, the natural value is a unique column — never
  both as keys with two FKs wandering between them.

## Bans (recap)

Keyless tables, mutable natural keys as FKs, email-as-PK, mismatched FK types, unindexed FKs,
nullable unique identity, auto-increment exposed as public business identity.
