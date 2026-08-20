# Command: migrate

Write safe, reversible, tested migrations (`domains/migrations.md` is the authority). The signature
command of this skill: a migration is a contract with production.

## Steps

1. Confirm the change from `shape` (or the request) and locate the migration tooling and history
   (from DATA.md). If the engine is PostgreSQL, MySQL, or SQLite, the matching
   `reference/engines/` sheet is this command's engine authority (non-locking forms, rebuild
   migrations, pragma realities).
2. Decide the strategy before writing:
   - **Additive** (new table/column/index) → one forward migration.
   - **Breaking** (rename, retype, remove) → expand/contract sequence: add → backfill →
     dual-write → switch reads → drop later. Never one-step.
3. Write the migration(s):
   - Small and single-purpose; one concern per file.
   - Idempotent and guarded (`IF NOT EXISTS`, existence checks).
   - Non-locking forms where the table is hot: `NOT VALID` + background `VALIDATE`,
     `CREATE INDEX CONCURRENTLY`, batched backfills (10k-row chunks).
   - A real `down` — tested the same way `up` is.
   - Data migrations with the same care: batched, reversible where possible, logged.
4. Add tests: up on a production-sized fixture (or a copy), down restores the prior state, existing
   rows survive with correct values (backfill correctness), the migration can run twice.
5. Document in the migration file: what it does to existing rows, the lock/load impact, the
   rollback path. The next person (and the on-call engineer) reads this at 3 a.m.

## Exit criteria

- Up and down tested; existing rows handled; hot paths non-locking; the migration review checklist
  in `domains/migrations.md` answered in the file comments.
- `check.mjs` clean on the migration files; no destructive DDL without the explicit approval
  recorded.

## Rules

- Never edit an applied migration — write a new one.
- A migration that can't roll back ships with a *written* reason and an incident plan, not a shrug.
- Seeds are not migrations; keep them separate.
