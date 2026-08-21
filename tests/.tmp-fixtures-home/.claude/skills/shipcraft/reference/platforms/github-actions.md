# Platform sheet: GitHub Actions

Loaded with `domains/pipelines.md`, `domains/gates.md`, `domains/config.md` when the work is a
GitHub Actions pipeline. The domains say *what* the pipeline must be; this sheet says *how* to
get there in Actions.

## The instruments

| Question | Instrument |
|---|---|
| Can anyone force a red past? | Branch protection: PRs required, **status checks required**, approvals per policy, force-push disabled — the platform baseline under every workflow (`domains/gates.md`) |
| Do two runs fight each other? | `concurrency:` group per environment/branch + `cancel-in-progress` — a stale deploy must not interleave with a live one |
| Are the actions themselves pinned? | Pin third-party actions to a **full commit SHA**, not a tag (`uses: actions/checkout@a1b2c3d…`) — a tag is a moving pointer, exactly like `:latest` |
| Do secrets stay in the store? | `secrets.<NAME>` referenced by name only; env-per-environment scoping; OIDC (`permissions: id-token: write`) for cloud auth instead of long-lived keys |
| Does the artifact get built once? | `actions/upload-artifact` + `download-artifact` between build and deploy jobs — never rebuild on the way to prod |
| Is the cache honest? | `actions/cache` keyed on the **lockfile hash**, not the branch name; a cache that never invalidates is drift in disguise |
| Is prod guarded by a human? | `environment: production` with required reviewers — the approval gate, recorded in the run (`domains/gates.md`) |
| Is the gate in the repo? | Reusable workflows (`on: workflow_call`) versioned in-repo — UI-configured checks are unowned gates |

## The workflow

1. **Fast first**: `validate` (lint/format/types) and `test` jobs run before `build`; they are
   `needs:` of every later job, so nothing slow starts until the cheap signals are green.
2. **Build once**: `build` produces the artifact and the digest-pinned image tag; `deploy`
   downloads the artifact — no recompilation between stages.
3. **Deploy with the promise**: the deploy job carries `environment:` (with reviewers) *and*
   the rollback reference — previous image tag or `workflow_dispatch` revert — in the same file
   (`domains/recovery.md`). A `rollback` job next to `deploy` is the honest shape.
4. **Prove the gates**: the workflow itself runs `ci-check --strict` against the workflow files
   after any change to `.github/workflows/` — the gate gates its own pipeline.

## The bans to enforce

- `continue-on-error: true` / `|| true` / `if: always()` without a written `# reason` —
  the red mask, Actions edition (`ship-floor.md` #3).
- `run: echo ${{ secrets.X }}` — interpolation into logs is an echo with extra steps (S1).
- Actions referenced by moving tag (`@v4`, `@main`) — pin SHAs (D2).
- `ubuntu-latest` when the pipeline claims reproducibility — pin runner versions.
- Cache keys without the lockfile hash — the "works sometimes" cache.
- Deploy-to-prod without `environment:` reviewers and without a rollback reference (P1, I2).
