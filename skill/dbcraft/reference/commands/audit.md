# Command: audit

Defect scan: constraints, types, indexes, migrations, and query safety. Finds and ranks — it does
not fix. No schema or code edits.

## Steps

1. Run `scripts/check.mjs --target <path>` for the deterministic set (float-for-money,
   varchar-255 sprawl, missing PKs, nullable columns, FKs without ON DELETE, unindexed FKs,
   SELECT *, interpolated SQL, WHERE-less mutations, destructive DDL, tz-less timestamps,
   json-column sprawl, boolean sprawl, stringly statuses, OFFSET pagination...).
2. For each table, check the constraint stack (`domains/constraints.md`): PK present, NOT NULL
   policy, UNIQUEs for real-world uniqueness, CHECKs for rules, FKs with explicit ON DELETE.
3. Check the index design (`domains/indexes.md`): FKs indexed, hot queries index-backed (spot-check
   the plans from DATA.md's hot-query list), unused indexes flagged for removal, soft-delete
   uniqueness handled.
4. Check migrations (`domains/migrations.md`): history present and consistent, downs exist, no
   edited applied migrations, no destructive changes without a plan, no drift between code-first
   models and the migration state.
5. Check query safety (`domains/queries.md`): parameterization, WHERE on mutations, bounded result
   sets, N+1 patterns in the code paths.
6. Output a ranked punch list: severity (Blocker / Major / Minor / Nit), table/file, rule, and the
   fix. Blockers = schema-floor violations. Sort by severity, then by data-integrity impact.

## Rules

- Cite the exact table/column/file for every finding — never vague impressions.
- Audit does not edit. The fix is a follow-up command (`constrain`, `index`, `normalize`,
  `harden`...).
- End with a one-line verdict and counts per severity.
