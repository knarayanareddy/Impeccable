# Command: contract-diff

Compare two API contracts mechanically and list the breaking changes. The floor's cardinal
sin — silent breaking changes — caught by a machine before it reaches a consumer.

## Usage

```bash
node <skill-dir>/scripts/contract-diff.mjs openapi/v1.yaml openapi/v2.yaml
node <skill-dir>/scripts/contract-diff.mjs old.yaml new.yaml --json   # CI-friendly
```

Exit 0 = no breaking changes; exit 1 = breaking changes (list each); exit 2 = usage error.

## What it detects

| Change | Why it breaks consumers |
|---|---|
| Removed operation (path + method) | Calls to it fail |
| Removed schema | Referenced types disappear |
| Removed property | Parsing breaks on the missing field |
| Changed property type | Consumer codecs reject the new type |
| Removed enum value | Previously valid payloads now fail |
| Added required property | Existing consumer payloads fail validation |

Additive changes (new operations, new optional fields, new enum values) are free and produce
no findings — that's the versioning ledger (`domains/versioning.md`), now mechanical.

## When to run it

- In CI on every spec change (fails the build on breaking diffs unless the version bump is the
  change's stated purpose).
- Before `version` — the diff is the justification for the new major.
- Before `deprecate` — confirms the removal is scheduled, not shipped.

## Rules

- The diff reads the spec's declared shape (paths → operations, components → schemas). If the
  spec uses a shape the extractor doesn't parse, findings will be conservative (fewer) — never
  assert "no breaking changes" on a spec the extractor couldn't read: verify the extraction
  with `--json` first.
- A breaking change that is *intended* still exits 1 — pair it with the version bump and the
  migration guide; the tool reports, the protocol decides.

## Known limitations (stated, not silent)

- **`$ref` properties are not followed** — a property typed as a `$ref` reports no type, so a
  change *inside* the referenced schema is invisible to the diff until the ref is resolved.
  Deferred to a later pass; until then, pair the diff with a manual review of referenced
  schemas' diffs.
- **Successors are not heuristics** — a removed operation reports breaking even when a `/v2`
  successor exists. That's deliberate: the versioning decision belongs to the human
  (`version`/`deprecate`), and the tool's job is to make the removal visible, never to bless
  it by pattern-matching.
- **Rename detection** — a renamed field reports as removed+added (both visible), not as a
  rename. Read the pair together; `rename`'s alias protocol is the fix, not the tool's.
