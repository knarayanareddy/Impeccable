# Command: align

Align the schema to its own conventions: one naming style, one name per concept, one time policy,
one money policy. Consistency is a schema feature — readers learn once and apply everywhere.

## Steps

1. Establish the local truth from DATA.md (or infer the dominant convention from the schema if
   DATA.md is missing — and offer to create it).
2. Inventory deviations:
   - **Naming:** table pluralization, column casing, FK naming (`user_id` vs `userId` vs
     `owner_id` for the same concept), abbreviation drift (`created_at` vs `created_ts`).
   - **One name per concept:** the same thing called three names across tables (the customer id is
     `user_id` everywhere or nowhere).
   - **Time and money:** tz-less timestamps vs timestamptz; NUMERIC money vs float money vs integer
     minor units — pick the convention and converge.
   - **Booleans vs statuses:** the same lifecycle modeled as flags in one table and a status in
     another.
3. Fix by the local truth:
   - Renames via expand/contract (`migrations.md`): add the canonical name, backfill, switch
     writers/readers, drop the old — never a silent in-place rename on live tables.
   - Type convergence is a breaking change: NUMERIC conversion goes through the expand/contract
     sequence with a data check (no rounding surprises).
4. Record the canonical vocabulary in DATA.md so the next table doesn't re-ask the question.
5. Verify: migration tests pass, counts match after renames, hot queries still plan well (renames
   break nothing but the name).

## Exit criteria

- One convention per axis across the schema; deviations fixed, scheduled, or documented with a
  date; the vocabulary recorded in DATA.md.

## Rules

- Align does not redesign. Same facts, same relationships — only the vocabulary converges.
- Consistency with the existing schema beats textbook style; if the schema says `user_id`, the
  next table says `user_id` too.
