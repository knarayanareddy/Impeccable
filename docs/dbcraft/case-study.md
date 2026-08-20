# Case study: the generic AI schema → the dbcraft pass

A before/after case study driven by the deterministic checker and the schema-diff — the
measured transformation, plus the migration's honest cost.

## The before

A typical AI-generated schema (`demos/dbcraft/before.sql`): nullable-everything with no key on
`users`, the VARCHAR(255) habit (4×), float money (`balance FLOAT`, `total DOUBLE PRECISION`),
tz-less timestamps (`TIMESTAMP`, `DATETIME`, `WITHOUT TIME ZONE`), FKs without ON DELETE,
boolean sprawl (3 flags), JSON sprawl (3 columns), and a stringly status.

The checker's verdict (`node skill/dbcraft/scripts/check.mjs --strict demos/dbcraft/before.sql`):

```
ERROR missing-primary-key     users — identity and integrity require one
ERROR float-for-money        balance FLOAT · total DOUBLE PRECISION
WARN  nullable-columns       users: 15 nullable columns · orders: 3
WARN  varchar-255-sprawl     4 × VARCHAR(255)
WARN  timestamp-without-tz   created_at, deleted_at, updated_at
WARN  fk-no-on-delete        orders.user_id
WARN  fk-without-index       orders.user_id
WARN  boolean-sprawl         3 flags
WARN  json-sprawl            3 JSON columns
WARN  stringly-status        status with no CHECK

dbcraft: 1 file(s) scanned · 3 error(s), 12 warning(s) · FAILED
```

## The pass

One dbcraft pass — `constrain` (keys, CHECKs, NOT NULL with documented nulls), `types`
(NUMERIC money in integer minor units, timestamptz, deliberate sizes), `normalize` (flags →
status, JSON → real columns), `index` (FK index, partial unique for soft deletes) — produces
`demos/dbcraft/after.sql`.

The checker also caught the *author's own* first draft: two nullable columns shipped without
documented null meanings — the floor rule working on its own demo, now fixed and noted here.

```
dbcraft: 1 file(s) scanned · 0 error(s), 0 warning(s) · clean ✓
```

## The migration cost, measured

`node skill/dbcraft/scripts/schema-diff.mjs demos/dbcraft/v1.sql v2-destructive.sql` reports the
one-step rewrite as **breaking** (2 changes: the retype, the FK removal) — the exact shape the
floor bans. The expand/contract path (`v2-expand-contract.sql`: add alongside, keep the old
shape, drop later) diffs **clean**. The demo runner shows both verdicts side by side — the
tool makes destructive intent visible so the human routes it through the protocol.

## The claim

The transformation is verifiable in both directions, and the migration's cost is measurable
before it touches data. Schema craft with a receipt.
