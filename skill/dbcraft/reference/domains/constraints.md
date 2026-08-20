# Domain: Constraints

Constraints are where the schema enforces truth. The app validates today; the constraint protects
forever. Every rule the domain has — uniqueness, ranges, enumerations, relationships — belongs in
the schema, because the database is the last line of defense against every buggy client that will
ever exist.

## The constraint stack (use all of it)

1. **NOT NULL** — the default for every column. Null is a decision with a documented meaning
   (`schema-floor.md` #2). If a column is nullable, the DDL comment says what null means.
2. **DEFAULT** — safe defaults at the storage layer: `DEFAULT false`, `DEFAULT now()`,
   `DEFAULT 'pending'`. New code paths and old migrations both get the right value.
3. **PRIMARY KEY** — every table, always (`domains/keys.md`).
4. **FOREIGN KEY + ON DELETE policy** — the relationship and its consequence, explicit:
   - `ON DELETE RESTRICT` — the parent may not be deleted while children exist (safest default;
     forces deliberate handling).
   - `ON DELETE CASCADE` — children die with the parent (line items of an order).
   - `ON DELETE SET NULL` — the child survives, orphaned by design (a comment's author).
   Never leave the policy to the engine's silent default — write it, it is the contract
   (`anti-patterns.md` C4).
5. **UNIQUE** — every real-world uniqueness: emails, slugs, code+type combinations (composite
   unique), plus **partial/functional uniqueness** for the soft-delete case
   (`domains/relationships.md` M5).
6. **CHECK** — every rule the column can enforce: `CHECK (amount > 0)`, `CHECK (char_length(code) =
   3)`, `CHECK (status IN (...))`. CHECK constraints are the cheapest migrations to add and the
   highest-value integrity you can buy.
7. **NOT VALID / NOT ENFORCED** (Postgres) — add constraints without locking the table, then
   validate in the background. Constraints are not a reason to take downtime.

## The rules

- **Enforce at the edge of truth.** A rule that lives in the schema is true; a rule that lives only
  in the app is a hope. Every app-side validation gets a schema-side twin.
- **Constraints are documented.** Each non-obvious constraint carries a comment stating *why*
  (`CHECK (status <> 'expired')` — why?).
- **Constraints are cheap until the data disagrees.** Adding a constraint to data that violates it
  is a migration project, not a DDL statement. Clean the data first (`constrain` does both in the
  right order).
- **Deferred constraints for batch operations** where the order of writes within a transaction
  temporarily violates a rule (`DEFERRABLE INITIALLY DEFERRED`) — the exception that proves the
  rules matter.

## The failure modes

- **App-only validation** — one bad deploy, one hand-written SQL, one legacy script: corrupted.
- **Nullable-everything** — three meanings per column (`omitted / unknown / not applicable`) and no
  way to tell them apart (`domains/payloads.md`'s cousin).
- **Missing uniqueness** — the duplicate is discovered by a customer, not by the schema.

## Bans (recap)

Keyless tables, FK-less designs, silent ON DELETE defaults, rules that live only in app code,
unconstrained status strings, nullable-by-reflex.
