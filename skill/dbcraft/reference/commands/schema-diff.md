# Command: schema-diff

Compare two schema snapshots mechanically and list the breaking changes. The floor's cardinal
sin — destructive migrations — made visible by a machine before it reaches production data.

## Usage

```bash
node <skill-dir>/scripts/schema-diff.mjs schema-v1.sql schema-v2.sql
node <skill-dir>/scripts/schema-diff.mjs old.sql new.sql --json   # CI-friendly
```

Exit 0 = no breaking changes; exit 1 = breaking changes (list each); exit 2 = usage error.
Snapshots are SQL text (`CREATE TABLE` / `CREATE INDEX` statements — pg_dump-style extracts
work; capture reality with your engine's dump tooling, not the migration history).

## What it detects

| Change | Why it breaks |
|---|---|
| Dropped table | All data and consumers break — expand/contract, never drop first |
| Dropped column | Existing data and reads break — add, dual-write, switch, drop later |
| Changed column type | Existing values may not survive the cast |
| Added NOT NULL without a default | Existing NULL rows fail — backfill before enforcing |
| Removed UNIQUE / CHECK / FK | Integrity loosened — the database stops enforcing the rule |
| Changed ON DELETE | Deletion semantics changed silently |
| Removed index | Hot paths may fall back to scans — verify the plan before dropping |

Additive changes (new tables, new nullable columns, new indexes, new checks, NOT NULL *with*
a default) are free and produce no findings — the migrations ledger
(`domains/migrations.md`), now mechanical.

## When to run it

- In CI on every schema change (fails the build on destructive diffs unless the change's stated
  purpose is the versioned, approved migration).
- Before `migrate` ships the down path — the diff justifies the expand/contract sequence.
- Before `modernize` — the diff is the list of breaking type changes the expand/contract
  sequence must carry.

## Rules

- The diff reads the shared SQL subset (CREATE TABLE columns/types/constraints + standalone
  indexes). If the snapshot uses syntax the extractor doesn't parse, findings will be
  conservative — never assert "no breaking changes" on a snapshot you couldn't extract:
  verify with `--json` first.
- Renamed columns report as dropped+added (both visible) — read the pair together; the
  expand/contract rename (`align`) is the fix, not the tool's.
- An intended breaking change still exits 1 — pair it with the expand/contract migration and
  the backup plan; the tool reports, the protocol decides.
