# Anti-patterns: the schema-slop tells

The fingerprints of a schema designed by an agent (or a team) that never had to live with its own
decisions. Each is a defect — not always a bug today, always a tax forever. Most have a deterministic
rule in `scripts/check.mjs`; the rest are LLM-judged with this file loaded.

## Type tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| T1 | FLOAT/DOUBLE for money | Binary floating point cannot represent decimal money; sums drift | NUMERIC/DECIMAL(p,s) — or integer minor units |
| T2 | `VARCHAR(255)` for everything | A habit, not a decision; says nothing about the data | Deliberate sizes per column; TEXT where unbounded |
| T3 | Timestamps without timezone | Every consumer guesses; daylight saving exposes the lie | timestamptz (or documented UTC policy) |
| T4 | Stringly status/type columns with no CHECK | Typos become permanent states | CHECK constraint or a native enum/lookup |
| T5 | Boolean flag sprawl (3+ flags one table) | Flags hide a lifecycle; combinations become states nobody modeled | Status enum / state machine column |

## Constraint tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| C1 | Nullable-everything | The schema refuses to say what is true | NOT NULL by default; null only with a documented meaning |
| C2 | No primary key | Duplicates, no stable identity, broken replication | A real key, always |
| C3 | No foreign keys ("the app handles it") | The app will not handle it; orphans will appear | FK constraints — they are the data's immune system |
| C4 | FKs with no ON DELETE policy | Silent database-specific defaults; deletes surprise everyone | Explicit RESTRICT / CASCADE / SET NULL, chosen per relationship |
| C5 | Rules that live only in app code (uniqueness, ranges, enums) | Any buggy client can corrupt the data permanently | Express every rule in the schema too |

## Modeling tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| M1 | EAV (entity-attribute-value: `entity_id / attribute / value`) | Queries become puzzles; types and constraints vanish | Real columns; JSON only where the shape truly varies |
| M2 | Polymorphic associations (`owner_type / owner_id`) | No FK possible; integrity is fiction | Separate join tables per owner, or a shared supertype table |
| M3 | JSON-as-schema ("just make it a json column") | No types, no constraints, no queryability | Real columns; JSONB only for genuinely variable payloads |
| M4 | Table-per-user / dynamic tables | Schema explosion; migrations become impossible | One table, user_id column, indexes |
| M5 | Soft deletes with no unique handling (`deleted_at` + UNIQUE on email) | Deleted rows block re-registration; uniqueness silently breaks | Partial unique index excluding deleted, or a tombstone design |

## Index tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| I1 | No index on foreign keys | Every join and cascade is a full scan | Index every FK column |
| I2 | Indexes nobody uses | Write amplification with zero read benefit | Design from query plans; drop the unused |
| I3 | Indexes on every column ("just in case") | Over-indexing slows every write | The query patterns decide the indexes |
| I4 | Composite indexes in the wrong order | `(a, b)` can't serve queries on `b` alone | Lead with equality columns, then ranges |

## Migration tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| G1 | Destructive migrations (`DROP TABLE`, `TRUNCATE`, `DROP COLUMN`) | Data loss with no path back | Expand/contract: add, migrate, remove — never destroy first |
| G2 | Irreversible migrations (no `down`) | Rollback becomes folklore | Tested down migrations, always |
| G3 | Migrations that can't run twice | Idempotency is the difference between an incident and a retry | Guard with IF NOT EXISTS / explicit checks |
| G4 | Seed data smuggled in migrations | Environment drift; production gets dev fixtures | Seed scripts separate from schema migrations |
| G5 | Schema drift from the ORM (code-first, no migrations) | The schema becomes whatever the last deploy decided | Migrations as the single source of truth, generated and reviewed |

## Query tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| Q1 | `SELECT *` in application code | Extra bytes, broken order expectations, silent breakage on schema change | Named columns, always |
| Q2 | String-built SQL with inputs | SQL injection — the oldest, still the worst | Parameterized queries, everywhere |
| Q3 | N+1 query patterns | One query per row; latency scales with data | JOINs, IN batches, or eager loading |
| Q4 | LIMIT/OFFSET at depth | Page 10,000 scans everything before it | Keyset pagination (`WHERE id > ?`) |
| Q5 | UPDATE/DELETE without WHERE | The one-row typo that empties the table | Guardrails: WHERE first, LIMIT, transactions |

## Detector mapping

`scripts/check.mjs` deterministically catches, with these rule ids: `float-for-money` (T1),
`varchar-255-sprawl` (T2), `timestamp-without-tz` (T3), `stringly-status` (T4),
`boolean-sprawl` (T5), `nullable-columns` (C1), `missing-primary-key` (C2), `fk-no-on-delete`
(C4), `dynamic-ddl` (M4), `fk-without-index` (I1, same-file check only), `destructive-ddl` (G1),
`select-star` (Q1), `interpolated-sql` (Q2), `offset-pagination` (Q4), `delete-without-where` /
`update-without-where` (Q5), `json-sprawl` (M3). No-`down` migration-file pairs are LLM-judged.
The rest are LLM-judged — keep this file loaded when auditing or reviewing.
