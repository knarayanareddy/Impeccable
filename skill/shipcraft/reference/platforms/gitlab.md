# Platform sheet: GitLab CI

Loaded with `domains/pipelines.md`, `domains/gates.md`, `domains/config.md` when the work is a
GitLab CI pipeline. The domains say *what* the pipeline must be; this sheet says *how* to get
there in GitLab.

## The instruments

| Question | Instrument |
|---|---|
| Can anyone push past the gates? | Protected branches + **required pipelines** on the default branch; protected environments for prod (`domains/gates.md`) |
| Is prod guarded by a human? | `environment: production` + **protected environment** with required approvers — the approval recorded in the deploy job |
| Are jobs staged honestly? | `stages:` ordered `validate → test → build → deploy → verify`, and `needs:` DAG overrides only where parallelism pays — never to skip a gate |
| Do secrets stay in the store? | Masked CI/CD variables referenced by name; `CI_JOB_TOKEN` for intra-instance calls; OIDC for cloud auth; per-environment variable scoping (`domains/config.md`) |
| Does the artifact get built once? | `artifacts:` from the build job + `dependencies:` in deploy — no rebuild between stages |
| Is the pipeline reusable? | `include:` of versioned templates in-repo — shared, reviewed, not copy-pasted per project |
| Do flaky steps get masked? | `allow_failure` only with a written reason; `retry:` only on known-flaky infra ops, **never** on test/verify jobs (`ship-floor.md` H3) |
| Is rollback a job? | A `rollback` job (`when: manual`, previous image tag) right next to deploy — the promise, in code (`domains/recovery.md`) |

## The workflow

1. **Fast first**: `validate` (lint/types) and `test` in the earliest stages; later stages are
   blocked on them by stage order or `needs:`, so a lint failure costs seconds.
2. **Build once**: `build` emits the artifact + digest-pinned image; `deploy` uses
   `dependencies: [build]` — the same bytes everywhere.
3. **Deploy with the promise**: `environment: production` (protected, approvers) and the
   rollback job in the same pipeline — the reviewer approves the change, the gates approve the
   quality, the rollback job keeps the promise (`domains/gates.md`).
4. **Prove the gates**: the pipeline runs `ci-check --strict` against `.gitlab-ci.yml` on
   every change to itself — the gate gates its own pipeline.

## The bans to enforce

- `allow_failure: true` on test/build/deploy jobs without a written `# reason` — the red
  mask, GitLab edition (`ship-floor.md` #3).
- `retry: 3` around `test:`/`verify:` jobs — the flake still exists, now slower (H3).
- `curl | sh` in `before_script` — the internet, executed with CI's permissions (H4).
- `image: ruby` / `image: node` without a tag — untagged is `:latest` (D2).
- Unprotected prod environment, or direct push to the default branch (gates that don't gate).
- `rules:` that quietly delete a required check — a rule that skips the gate is a gate rewrite;
  make it explicit and reviewed.
