# Command: normalize

Run the normal-forms pass: 1NF → 3NF+ (`domains/normalization.md` is the authority). The highest-
leverage structural repair a schema can receive — and the one most likely to break things if done
destructively, so it's done the migration way.

## Steps

1. For each table, list the functional dependencies (what determines what) and hunt the violations:
   - 1NF: repeating groups, CSV/array columns, one-cell-many-facts.
   - 2NF: composite-key tables where columns depend on part of the key.
   - 3NF: transitive dependencies (`orders.customer_name` depends on `customer_id`, not the order).
2. Rank fixes by data-integrity impact, cheapest first.
3. For each fix, plan expand/contract (`domains/migrations.md`):
   - Create the new table (with its own PK, constraints, and ON DELETE policies).
   - Backfill from the source in batches; dual-write briefly if the app is live.
   - Switch reads to the new table; verify counts match.
   - Drop the old columns/tables in a later release — never in the same step.
4. Each new table gets the full constraint stack in the same migration: NOT NULL, UNIQUE, CHECKs,
   FK + index + ON DELETE policy (`constrain` merges here).
5. Verify: row counts match before/after, the hot queries still plan well (join path verified),
   migration down tested.

## Rules

- Normalization is structural repair, not redesign: same facts, better storage. Behavior of the
  data meaning must be identical.
- Never normalize destructively — the backfill/dual-write/switch/drop sequence is mandatory on any
  table with live data.
- Stop at 3NF unless an anomaly is actually observed; the textbook beyond-BCNF cases are rare and
  the migrations expensive.

## Exit criteria

- Violations fixed or explicitly deferred (with a date); counts verified; constraints in place;
  migrations reversible and tested.
