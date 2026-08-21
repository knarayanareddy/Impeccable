# Command: ci-check

The shipcraft floor as a mechanical gate over **one shipped workflow/pipeline**: parse the
pipeline into its steps and fail on every rule the checker knows. This is `gate` in tool form —
the answer to "does THIS pipeline hold the floor?" is produced by code, not by vibes, and it is
built to sit in CI as the blocking gate.

## Usage

```bash
node <skill-dir>/scripts/ci-check.mjs --pipeline .github/workflows/ci.yml
node <skill-dir>/scripts/ci-check.mjs --pipeline .gitlab-ci.yml --strict --json
```

Exit 0 = gate holds · exit 1 = findings (warnings only fail with `--strict`) · exit 2 = usage,
parse, or shape refusal. `--pipeline <file>` is required.

## What it enforces

The same vocabulary as `scripts/check.mjs` (shared, so the two tools cannot drift):

- **Red masks** — `|| true`, `|| exit 0`, `continue-on-error: true`, `allow_failure: true`,
  `set +e`. A written `# reason…` comment keeps it a reviewed exception, not a mask.
- **Secret echoes** — `echo $DATABASE_PASSWORD`-style lines (error).
- **`curl | sh`** — and the `curl -o f && sh` form, unless the download is checksum-verified
  first (`sha256sum -c`), which is the floor itself.
- **Unpinned installs** — `npm install` (not `npm ci`), `pip install` without a lockfile
  source, `go get`.
- **`:latest` / untagged images** — including `image: app`, `FROM node`, `docker build -t app`.
- **Force flags** — `git push -f` and `--force` on publish/apply/upgrade ops. (`kubectl apply
  -f` is `--filename`, not force — it passes.)
- **Destructive ops without a guard reference** — `rm -rf`, `kubectl delete`,
  `terraform destroy` need a visible approval/rollback/backup reference.
- **Pipeline retries around test/check steps** — the flake still exists, now slower.
- **Deploy steps with no rollback reference anywhere in the file** — the promise nobody can
  keep (P1).

## Accepted shapes

- **Workflow YAML (subset)** — GitHub Actions (`jobs:` → `steps:` → `- name:/run:`),
  GitLab CI (`script:` dash-items), Azure, CircleCI: an indentation-aware step parser
  extracts every `name`/`run`/`script`/`command`/`uses`/`image` carrier. `#` comments are prose.
- **Pipeline JSON** — native: an array/object walk collects `run`/`script`/`command` strings
  (Buildkite, JSON workflows).
- **Dockerfile / Makefile / docker-compose** — no step structure; line-scanned with the same
  rules (comments stripped, the `# reason` escape preserved).

## Honesty rules

- A file that **parses to zero steps** (or JSON of the wrong shape) exits 2 — "gate holds" on
  an empty parse is a lie.
- An unrecognized format exits 2 rather than passing by scanning prose.
- Findings are never silently defaulted; missing structure is a refusal, not a pass.

## CI wiring

Run it in the pipeline itself with `--strict --json` after any workflow change; a pipeline
that grows a mask, a secret echo, or a rollback-less deploy fails the build. The gate that
blocks its own pipeline is the `gate` command's doctrine in production.
