# Domain: Builds

Builds are where determinism is won or lost. The rule is one sentence: **the same commit, the
same pipeline, the same artifact — anywhere, any time.**

## The determinism checklist

1. **Lockfiles pinned and committed** — package managers install from the lockfile in CI
   (`npm ci`, `pip install` against a pinned lock, `go mod verify`), never floating resolves
   (`anti-patterns.md` D1). Lockfile updates are their own PRs, reviewed like code.
2. **Toolchain versions pinned** — the compiler, the runtime, the CLI tools: pinned in the
   pipeline config or a version file, not "latest available on the runner".
3. **Hermetic or near-hermetic** — builds read only declared inputs; network fetches go through
   pinned, checksummed dependencies. The build that depends on what's on the runner's disk is a
   lottery with a CI badge.
4. **No curl|sh** (`anti-patterns.md` H4): installers are pinned versions with checksums —
   executing the internet with CI's permissions is the supply chain's front door.

## Artifact discipline

- **Build once, promote unchanged** (`anti-patterns.md` D3): the artifact that passed tests is
  the artifact deployed — tagged, stored, and referenced by digest, not rebuilt per environment.
- **Immutable and versioned** — images by content digest or unique version; `:latest` is banned
  from pipelines and deploys (`anti-patterns.md` D2) because "latest" is a different image
  tomorrow.
- **Artifacts carry provenance** — commit SHA, pipeline run, and build inputs recorded (SBOM-
  style metadata): the artifact's own audit trail for the 2 a.m. "what exactly is running in
  prod?" question.
- **No secrets in artifacts** (`domains/config.md`): secrets inject at runtime; artifacts are
  scanned for them before release.

## Caching, honestly

- Caches are content-addressed and invalidated by their inputs (lockfile hash, not date). A cache
  key that doesn't change when inputs change serves stale truth — a flake generator with a warm
  feeling.
- Cache what's expensive and stable (dependencies), never what must be fresh (test results,
  config).

## Bans (recap)

Floating installs, latest tags, per-environment rebuilds, runner-disk dependence, curl|sh,
uncached-but-pinned-nowhere, artifacts without provenance, secrets in images.
