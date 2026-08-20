# Command: document

Schema comments and the data dictionary. The goal is a schema that explains itself at the place
where the truth lives — the DDL — not a wiki that drifts.

## Steps

1. Audit the current state: which tables/columns lack comments, which comments have rotted (say
   what the schema no longer does), where the null meanings and units are unexplained.
2. Write comments per the rules:
   - **Table comments:** what the table *is* in the domain ("Orders placed by buyers; immutable
     after fulfillment"), not the mechanism ("The orders table").
   - **Column comments:** the fact the column records, the unit/format where it matters
     (`amount_cents` — "in USD minor units"), the null meaning when nullable ("null = never
     shipped"), and the *why* of non-obvious constraints.
   - **State columns:** the full vocabulary of a status enum lives in the comment or CHECK — a
     reader must never grep the app to learn what `status = 4` means.
   - **Denormalized columns:** the named writer and the reconciliation job, per the denormalize
     gate (`normalization.md`).
3. Comments ship as migrations (COMMENT ON ... in the same discipline as any DDL — versioned,
   reversible).
4. Wire the dictionary: generate the data dictionary from the live schema comments (the engine's
   catalogs) — documentation that is generated from truth cannot drift.
5. Kill parallel docs: mark the wiki as derived, or delete it. Two sources of schema truth is drift
   by construction.

## Rules

- A documentation pass that only adds text has failed — rotted comments are deleted, not
  preserved.
- Comments explain *why and what it means*, never *what it is* ("amount NUMERIC(12,2)" needs no
  comment saying "the amount").
- The null-meaning rule is absolute: every nullable column states its null meaning in the DDL
  (`schema-floor.md` #2).

## Exit criteria

- Every table and every non-obvious column commented in the DDL; null meanings complete; the data
  dictionary generated from the schema; parallel docs retired.
