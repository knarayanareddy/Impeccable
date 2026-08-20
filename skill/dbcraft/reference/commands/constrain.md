# Command: constrain

Add the constraints the schema is missing — the highest-value integrity pass that exists
(`domains/constraints.md` is the authority). Every rule the domain has becomes schema truth.

## Steps

1. Inventory what's missing per table: NOT NULL (with documented null meanings), UNIQUEs for
   real-world uniqueness, CHECKs for ranges/enums/cross-column rules, FKs with explicit ON DELETE,
   defaults at the storage layer.
2. **Clean the data before adding the constraint** — in the same migration, in this order:
   - Find violations (`SELECT ... GROUP BY ... HAVING COUNT(*) > 1` for uniqueness; range checks
     for CHECKs).
   - Decide per violation: fix, merge, or tombstone — with the product's answer where the data's
     intent is ambiguous (never guess-delete customer data).
   - Add the constraint `NOT VALID`, then `VALIDATE` in the background — zero lock time
     (`domains/migrations.md`).
3. Add the constraint with a comment stating *why* the rule exists — constraints without reasons
   get "simplified" away by the next person.
4. Mirror every rule that also lives in app code: the schema-side twin makes the app-side version a
   courtesy, not the last line of defense.
5. Verify: constraint validates, the migration rolls back, the app's existing valid data still
   passes (run the app's test suite + a data smoke check).

## Exit criteria

- Each fix listed in `audit` addressed or explicitly deferred with a reason and a date.
- All new constraints documented, validated, and reversible.
- Data cleaned before constraint — never constraint-first with a surprise outage.

## Rules

- A constraint that fails on real data is a discovery, not an error: report the violations and the
  options, don't silently drop rows.
- Constraints are cheap to add and priceless to have; when in doubt whether a rule is "really
  needed", the database is the place the doubt gets resolved — add it.
