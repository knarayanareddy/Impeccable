# Domain: Migrations

Migrations are the schema's history — the only path from what exists to what should exist, run
against production data that people depend on. Treat them with more ceremony than any feature code.

## The discipline

1. **Additive-first.** The default migration adds: new tables, new columns (nullable or with a
   default), new indexes. Nothing existing changes.
2. **Expand/contract for breaking changes.** Never `DROP COLUMN` or change a type in one step:
   - *Expand:* add the new column (nullable), dual-write both, backfill, switch reads, verify.
   - *Contract:* after the old column is fully unused, drop it — in a later release.
   Renames are the same dance (add `new_name`, backfill, switch, drop `old_name`).
3. **Reversible.** Every migration has a working `down`, tested the same way `up` is. Rollback is
   not folklore — it is the difference between an incident and a recovery.
4. **Idempotent and guarded.** `IF NOT EXISTS`, existence checks, and transactionality where the
   engine allows. A migration that can't run twice is a trap for every re-run, replay, and
   partial-failure scenario.
5. **Safe under load.** Prefer non-locking forms: `ADD COLUMN IF NOT EXISTS ... NOT VALID` +
   background `VALIDATE CONSTRAINT`, `CREATE INDEX CONCURRENTLY` (no lock), batched backfills
   (10k-row chunks, not one giant UPDATE). A migration that takes an exclusive lock on a hot table
   is an outage with a filename.
6. **Data migrations are migrations too.** Backfills and transforms get the same versioning, the
   same reversibility, the same review — and they are the dangerous half (code is testable; data
   migrations run once against truth).

## The patterns

- **States in the migration file:** the migration framework's state (up/down applied) is tracked;
  never edit an applied migration — write a new one that corrects it.
- **Seeds are not migrations.** Seed/sample data lives in separate, environment-aware scripts.
- **Generated-from-code is fine; unversioned is not.** ORM code-first with migration files is
  healthy; ORM code-first with `synchronize`-style auto-DDL in production is drift
  (`anti-patterns.md` G5).
- **Each migration is small and single-purpose.** One concern, reviewable in a minute, reversible
  in isolation.

## The review checklist (`migrate` bakes this in)

- What happens to existing rows? (backfill, default, nothing?)
- Can it run twice? Can it roll back? On how much data?
- Does it lock anything hot? For how long? (test on a production-sized copy)
- Is the `down` real — or a shrug?
- Is there a destructive operation? → backup, plan, and explicit approval first
  (`DROP`/`TRUNCATE` never ship silently).

## Bans (recap)

Destructive one-step changes, irreversible migrations, unlocked hot-table DDL, seed-in-migration,
edited applied migrations, auto-DDL drift, giant single-UPDATE backfills.
