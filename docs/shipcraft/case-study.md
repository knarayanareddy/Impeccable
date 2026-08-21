# Case study: the generic-AI workflow → the shipcraft pass

A before/after case study driven by the deterministic checker and the ci-check pipeline gate —
the measured transformation, both directions.

## The before

A typical AI-generated GitHub Actions workflow (`demos/shipcraft/before-workflow.yml`): an
unpinned `npm install`, a test step whose failure is masked with `|| true` so red still means
green, a database password echoed into the build log, an installer curled off the internet and
piped to bash, a build tagged `app` (untagged = `latest`), a forced `kubectl apply`, and a
deploy with no rollback reference anywhere in the file.

The checker's verdict (`node skill/shipcraft/scripts/check.mjs --strict`):

```
WARN  unpinned-install  before-workflow.yml:8   npm install
ERROR masked-failure    before-workflow.yml:9   || true
ERROR secret-echo       before-workflow.yml:10  secret in log output
WARN  pipe-to-shell     before-workflow.yml:11  curl | sh
WARN  latest-tag        before-workflow.yml:12  -t app (untagged = latest)
WARN  force-flag        before-workflow.yml:16  kubectl apply --force

shipcraft: 1 delivery file(s) scanned · 2 error(s), 4 warning(s) · FAILED
```

And the gate (`node skill/shipcraft/scripts/ci-check.mjs --pipeline … --strict`): the same six
findings, step by step, plus the file-level promise gap:

```
WARN  deploy-without-rollback  Deploy steps with no rollback/revert reference — P1
ci-check: 6 step(s) · 2 error(s), 5 warning(s) · GATE FAILED
```

Every green build from this workflow was a lie in six parts: the tests could fail silently, the
log was a credential store, tomorrow's install was a lottery, and the deploy was a promise
nobody could keep.

## The pass

`/shipcraft pipeline` rewrites the workflow (`demos/shipcraft/after-workflow.yml`) in the boring
shape:

- **Stages, fast first**: `validate` (lint) → `test` → `build` → `deploy`, each job `needs:` the
  previous, so a lint failure costs seconds, not a full suite.
- **Deterministic installs**: `npm ci` from the lockfile; the checkout action pinned to a full
  commit SHA; the image tagged `app:3.2.1`.
- **No masks**: the test step either passes or the build is red — and red is information.
- **Secrets by reference**: nothing echoed; credentials stay in the platform store.
- **The promise, in code**: the deploy job sits behind `environment: production` (approval) and
  carries `./rollback.sh --verify` — the revert path exists and is rehearsed, in the same file
  as the deploy.

Both tools now agree — checker clean, gate holds:

```
shipcraft: 1 delivery file(s) scanned · 0 error(s), 0 warning(s) · clean ✓
ci-check: 11 step(s) · 0 error(s), 0 warning(s) · gate holds ✓
```

## What the transformation measures

| Signal | Before | After |
|---|---|---|
| Checker errors | 2 (mask, secret echo) | 0 |
| Checker warnings | 4 | 0 |
| Gate findings | 7 (incl. deploy-without-rollback) | 0 |
| Masked failures | 1 | 0 |
| Rollback references in the deploy file | 0 | 1 (armed) |

## Why the two tools, not one

The checker scans a whole repo and tells you *where the slop is*; the gate parses one pipeline
into its steps and tells you *whether this pipeline may ship*. The checker runs in the agent
loop after every edit; the gate runs in CI and blocks. Both share the same rule vocabulary
(`scripts/lib/pipeline-rules.mjs`), so a finding in one is a finding in the other — and the
43 pinned behavioral scenarios keep both honest.

## The lesson

The before workflow was not malicious — it was *default*. Every anti-pattern in it is the
path of least resistance for generated pipelines. Shipcraft's job is to make the honest shape
the boring one: same stages, same promise — but green means shippable, the log keeps no
secrets, and the rollback is one rehearsed command away.
