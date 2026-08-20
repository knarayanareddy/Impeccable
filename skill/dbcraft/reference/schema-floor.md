# Schema floor

Load this file **immediately before editing any schema or migration**. It is the non-negotiable
floor, the absolute bans, and the reflexes no detector catches. When the team's published data
conventions are stricter, theirs win.

## The floor

1. **Every table has a primary key.** No keyless tables, ever. Surrogate key unless a natural key is
   truly stable (`domains/keys.md`). Composite keys only when the combination *is* the identity.
2. **Every column NOT NULL unless null has a documented meaning.** Each nullable column's null
   meaning is stated (in the DDL comment or data dictionary). Nullable-everything is a defect.
3. **Every foreign key has: an index on the referencing column, and an explicit ON DELETE policy**
   (RESTRICT / NO ACTION / CASCADE / SET NULL — chosen and written, never left to default silently).
4. **Every rule expressible in the schema lives in the schema.** Uniqueness, ranges, enumerations,
   and cross-column rules become UNIQUE / CHECK / FK constraints — never app-only validation. The
   database is the last line of defense (`domains/constraints.md`).
5. **Types carry meaning.** Money is NUMERIC/DECIMAL (never float); timestamps are timestamptz (or a
   documented UTC policy); sizes are deliberate, not `VARCHAR(255)` by habit; booleans are booleans
   (`domains/types.md`).
6. **Migrations are safe, reversible, and tested.** Additive-first; breaking changes use
   expand/contract; every migration has a tested `up` and a reasoned `down`; no destructive operation
   ships without a plan, a backup, and a rollback path (`domains/migrations.md`).
7. **Every routine query is index-backed.** Hot-path queries verified against the plan; indexes
   designed from queries, not columns; FKs indexed; no over-indexing (`domains/indexes.md`).
8. **Queries are parameterized, set-based, and bounded.** No string-built SQL with inputs; no N+1
   loops; every query has a bound (limit or a walked index); keyset pagination at depth
   (`domains/queries.md`).
9. **One naming convention.** Tables plural, columns singular, snake_case (or the team's written
   choice), one name per concept, foreign keys `referenced_table_id`. Consistency is a schema
   feature (`align`).
10. **The schema is documented where it lives.** Table and column comments in the DDL; the data
    dictionary is generated from them, not maintained in a wiki (`document`).

## Absolute bans (deterministic — most are caught by `scripts/check.mjs`)

- `SELECT *` in application code
- FLOAT / DOUBLE / REAL for money-adjacent columns (amount, price, fee, balance, total, tax...)
- `VARCHAR(255)` as the one-size-fits-all default
- CREATE TABLE without a primary key
- `DELETE FROM` or `UPDATE` without a WHERE clause
- String-concatenated / interpolated SQL built from inputs
- `DROP TABLE` / `TRUNCATE` in migrations without a stated plan
- Timestamps without timezone on created_at/updated_at-family columns
- JSON/JSONB used as a schema (3+ json columns where real columns belong)
- Dynamic DDL in application code (CREATE TABLE built from variables)
- LIMIT/OFFSET pagination at depth (keyset instead)
- 3+ boolean columns on one table (state machine → status enum)
- Stringly status/type columns with no CHECK
- FKs with no ON DELETE clause (explicitness is the craft)

## Reflexes (no detector catches these)

- **The schema says what is true.** When the app and the schema disagree about a rule, the schema is
  right and the app is a bug. Move the rule into the schema.
- **Ask "what does this look like in ten years?"** — with a million rows, with the fourth app
  writing to it, with the person who designed it gone.
- **A migration is a contract with production.** Review migrations with the same seriousness as
  payment code: what happens to existing rows? Can it run twice? Can it roll back?
- **The slowest query is the one you haven't looked at.** Spot-check the top 3 query plans every
  pass — an index that doesn't get used is furniture.
- **Duplicate data needs a named owner.** Every denormalized copy names the writer and the
  reconciliation job; otherwise the two copies will drift and the drift will be discovered in
  production.
- **Time always has a zone.** A timestamp without a documented timezone is a lie waiting for
  daylight saving to expose it.
- **Booleans grow up into enums.** Today's `is_active` is tomorrow's `active / suspended /
  pending_deletion`. Model state, not flags, when the domain has a lifecycle.
