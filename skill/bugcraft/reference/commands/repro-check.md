# Command: repro-check

The evidence floor as a mechanical gate over **bug records**: validate the repro-signature
quartet, the evidence rung, and the closure contract — and fail on gaps. The `repro`, `shape`,
and `fix` commands' contracts, in tool form.

## Usage

```bash
node <skill-dir>/scripts/repro-check.mjs --bugs bugs.yaml
node <skill-dir>/scripts/repro-check.mjs --bugs bugs.json --json
```

Exit 0 = every record holds the floor · exit 1 = gaps · exit 2 = usage, parse, or shape
refusal. `--bugs <file>` is required.

## What it enforces

- **The repro signature quartet** (every record): `observed`, `expected`, `steps` (the repro
  path), `environment` — a record without them is a suspicion, not a bug
  (`evidence-floor.md` #1; `domains/reproduction.md`).
- **The evidence rung**: `evidence-level` must be on the ladder — `0`-`5` or
  `observation` / `repro` / `minimal-repro` / `confirmed-hypothesis` / `verified-fix`
  (`domains/evidence.md`: an unlabeled claim is a bluff).
- **The status vocabulary**: `open` / `fixed` / `cannot-reproduce` / `wont-fix` / `duplicate`.
- **The closure contract**:
  - `fixed` → `root-cause` and `pin` required — "it works now" without an explanation is a
    hypothesis, not a conclusion, and a fix without a regression pin can return
    (`evidence-floor.md` #5, #8).
  - `cannot-reproduce` → `instrumentation` and `ticket` required — the honest artifact is
    the instrumentation + the ticket, never a blind patch (`commands/repro.md` step 5).

## Accepted shapes

- **YAML (subset)**: a `bugs:` list of `- id:` items with `key: value` pairs; a nested list
  under a bare key (the `steps:` bullets) accumulates into that key. `#` comments are prose.
- **JSON**: native — a top-level array or an object with a `bugs` array.

## Honesty rules

- A file that parses to **zero** records exits 2 — "all records hold" on an empty parse is a lie.
- A non-object entry, an unparseable JSON file, and an unrecognized shape all refuse up front.
- Missing fields are gaps, never silently defaulted.

## CI wiring

`--json` + exit codes make this the bug-tracker gate: export the open/fixed bugs as
`bugs.yaml`, run `repro-check` in CI, and any record that loses its repro path, its rung,
or its closure contract fails the build.
