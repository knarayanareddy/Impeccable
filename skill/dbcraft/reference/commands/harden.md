# Command: harden

Edge cases: uniqueness under soft deletes, concurrency, and deletion policy — make the failure paths
as designed as the happy path (`schema-floor.md` is the authority). This is where schemas quietly
corrupt data.

## Steps

1. Enumerate the hardening surface per table: × {duplicate write, concurrent write, concurrent
   delete, soft delete + re-register, delete parent with children, null meaning, boundary values}.
2. For each, verify or implement:
   - **Uniqueness under soft deletes** (`indexes.md`): partial unique index excluding deleted rows
     (or the tombstone design) — for *every* unique constraint the table has.
   - **Lost-update protection** (`queries.md`): the write path for shared rows uses FOR UPDATE,
     optimistic versioning, or atomic expressions — and the choice is documented per table.
   - **Deletion policy** (`constraints.md`): ON DELETE explicit per FK; soft-delete state modeled
     (a deleted parent with living children is a state, not an accident).
   - **Boundary values** (`types.md`): zero/negative/oversized values constrained (CHECKs), money
     signs and magnitudes, text length limits enforced, timezone correctness on every write path.
   - **Retention** — if DATA.md has a retention policy, the deletion jobs and their indexes exist
     and are scheduled, not promised.
3. Verify with the failure-matrix walk: for each table, reason through (or test) each failure class
   and record the outcome — duplicates rejected, lost updates prevented, deletes behaving per
   policy.

## Exit criteria

- Every failure class maps to a constraint, an index, or a documented policy — none left to hope.
- The failure matrix recorded per table (or table-class).
- check.mjs clean on the changed files.

## Rules

- Harden adds guarantees; it doesn't redesign or add features.
- A constraint that the data can't pass is a discovery: report, decide with the product, then
  enforce — never silently drop or "fix" rows.
- If the concurrency model itself is unclear, `review` it first — hardening around a broken model
  hardens the wrong thing.
