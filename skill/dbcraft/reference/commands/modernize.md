# Command: modernize

Upgrade types and idioms to the engine's current best practice (`domains/types.md` is the
authority). The surgical upgrade pass — every change here is a breaking change, so it all goes
through expand/contract.

## The common upgrades

- **`timestamp` → `timestamptz`** (Postgres): the highest-value modernize there is. Convert with an
  explicit session timezone (`SET TIME ZONE 'UTC'`) so values don't silently shift.
- **`VARCHAR(255)` habit → deliberate sizes / TEXT** where the length was never a domain fact.
- **Stringly statuses → CHECK constraints or native enums** (CHECK preferred when the vocabulary
  may grow — extending a CHECK is a cheaper migration than altering an enum type).
- **Boolean sprawl → status column** with a state machine where the domain has a lifecycle.
- **`serial` → `GENERATED ALWAYS AS IDENTITY`** (Postgres): sequence ownership made correct.
- **Integer IDs → UUID/ULID** where distributed generation or unguessability now matters — the
  most expensive upgrade there is; do it only with a measured reason.
- **JSON text → JSONB** where payloads are queried.
- **Charset/collation/engine-level defaults** the current version discourages — check the engine's
  own upgrade guidance at the time of use.

## Steps

1. List candidate upgrades from `audit`/`measure`; rank by data-integrity and query impact.
2. Verify each against the engine version in DATA.md — never modernize past what the running
   engine supports.
3. Implement each via expand/contract (`migrations.md`): add the new column/type alongside,
   backfill with explicit conversions (checking values — e.g., the timestamptz conversion must
   assert the old values' intended zone), switch readers/writers, drop the old in a later release.
4. Data checks at every step: conversions are verified (`SELECT` spot-checks, count comparisons),
   never trusted.
5. Update DATA.md's conventions to the new state.

## Rules

- Modernize the types, never the model — this is not a redesign command.
- Each change is breaking by nature; none of it ships as an in-place alteration.
- If the upgrade needs downtime or a lock, the plan says so up front — with the measured size of
  the table.
- Stop before churn: a schema modernized last year needs nothing.

## Exit criteria

- Each upgrade migrated, verified, and rolled out expand/contract; DATA.md updated; checker clean.
