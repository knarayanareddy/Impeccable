# Engine sheet: PostgreSQL

Loaded with the relevant domains when the engine is Postgres. The native-accent specifics;
the compass domains still hold.

## Types & identity

- `GENERATED ALWAYS AS IDENTITY` over `serial` (sequence ownership is correct by construction);
  `BIGINT` identity default, UUID/ULID where distribution demands (`domains/keys.md`).
- `TIMESTAMPTZ` for every instant (`domains/types.md`); `TIMESTAMP WITHOUT TIME ZONE` only for
  wall-clock-with-context cases, commented.
- NUMERIC(p,s) for money; `citext` (with the extension) or `lower()` functional indexes for
  case-insensitive uniqueness; JSONB (never JSON) for payloads.

## Constraints & integrity (the deep Postgres kit)

- **RLS** for multi-tenancy (`domains/constraints.md`'s section): deny-by-default policies,
  transaction-scoped tenant settings, `SET ROLE` tests, no `BYPASSRLS` for service accounts.
- **Partial indexes** for soft-delete uniqueness: `CREATE UNIQUE INDEX … WHERE deleted_at IS
  NULL` (`domains/indexes.md`).
- **`NOT VALID` + `VALIDATE CONSTRAINT`** for zero-lock constraint additions; 
  **`CREATE INDEX CONCURRENTLY`** for indexes on hot tables (`domains/migrations.md`'s
  non-locking forms).
- `CHECK` constraints are the cheapest integrity you can buy — prefer them over native enums
  when the vocabulary may grow (extending a CHECK is cheaper than altering an enum type).
- `DEFERRABLE INITIALLY DEFERRED` only for batch operations that temporarily violate a rule —
  documented, never default.

## Operations

- `EXPLAIN (ANALYZE, BUFFERS)` on production-sized data before trusting an index
  (`domains/indexes.md`); `pg_stat_user_indexes` for the unused-index audit.
- `VACUUM`/autovacuum awareness on write-heavy tables; bloat is a maintenance budget, not a
  surprise (`domains/migrations.md`'s lock impact).
- `pg_dump` snapshots are the schema-diff input (`schema-diff`); migrations are the history.

## Bans

`serial` where identity exists, tz-less timestamps, JSON (not JSONB) payloads, enum types for
growable vocabularies, unindexed FKs, lock-taking DDL on hot tables without the concurrent
forms, RLS-less multi-tenant tables.
