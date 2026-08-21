# Command: init

Capture the data conventions and schema policy so every later command reads the same facts. One-time
setup per project (or per database).

## Steps

1. Inspect, don't interrogate. Read the migration history, the schema (DDL dump or ORM models), the
   query hotspots in the code, and the docs. Extract the facts.
2. Ask the user only what the code can't answer:
   - The engine and version (PostgreSQL 16? MySQL 8? SQLite?)
   - Traffic shape: read-heavy? write-heavy? how large are the big tables?
   - The naming convention, if not inferable from the existing schema
   - Policy questions: soft deletes? multi-tenancy? data retention? backup/RPO expectations?
   - Frozen zones: tables owned by another team or legacy systems that must not be touched
3. Write `DATA.md` at the project root (or `.dbcraft/DATA.md` if the root is crowded) — start from the template `assets/DATA.example.md`:
   - Engine, version, and migration tooling (and where migrations live)
   - Naming conventions: tables plural, columns snake_case, FK = `{table}_id`
   - Key strategy: BIGINT identity / UUID / ULID — and where each applies
   - Time and money conventions: timestamptz UTC; NUMERIC(12,2) or integer minor units
   - Soft-delete policy, multi-tenancy model, retention rules
   - The hot queries: the 5–10 query patterns that must stay index-backed
   - Frozen zones and legacy constraints
4. End with the recommended next step: usually `review` for an unfamiliar schema, `audit` if it
   already looks sloppy, `shape` for a new domain.

## Rules

- Facts only — DATA.md is shared memory, not an essay. Keep it <80 lines.
- Never ask what the schema or migration history already answers; never re-ask across sessions.
- No schema edits during init. This command captures context.
