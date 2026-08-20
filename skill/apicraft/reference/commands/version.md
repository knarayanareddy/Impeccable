# Command: version

Design or apply the versioning and compatibility strategy (`domains/versioning.md` is the authority).
The moment this is missing is the moment the API starts ambushing its consumers.

## Steps

1. Establish the current state: is there a version anywhere (path/header)? A changelog? A
   deprecation policy? If the API is public and unversioned, that's the first finding.
2. Define or confirm the policy (record in API.md):
   - Mechanism: URI (`/v1`), header (`Accept: application/vnd.acme.v2+json`), or date-based — pick
     one and stop.
   - The breaking-change ledger: what counts as breaking *here* (tightened validation? reordered
     arrays? new required field?) — write it down.
   - Compatibility window: N-1 supported for how long; announced where.
3. For an upcoming breaking change, plan the version:
   - Decide whether it's worth a version bump at all (batch breakage — a version exists to carry a
     *coherent* set of changes, not one rename).
   - Scope v2: the full list of changes, the migration guide (old → new, mechanical steps), and the
     sunset plan for v1 (`deprecate`).
   - Mark additive changes that can ship in v1 immediately — free now, out of v2's risk.
4. Update the spec, changelog, and SDK generation for the new version; keep v1 untouched and
   serving.
5. Verify: v1 behavior byte-identical; v2 diff is exactly the announced set; spec-diff in CI shows
   only intended changes.

## Rules

- Never bump a version for additive changes; never sneak breaking changes into an existing version
  ("bugfix" included — if consumers may depend on the old behavior, it's breaking).
- Version numbers are major-only in paths (`/v1.1` is banned); semver lives in the spec/changelog,
  not the URL.
- A version bump is a product decision with a migration budget — present it as one (cost, window,
  guide), not as a code change.

## Exit criteria

- Policy written, mechanism applied, changelog current, migration guide ships with the version,
  old version's fate scheduled.
