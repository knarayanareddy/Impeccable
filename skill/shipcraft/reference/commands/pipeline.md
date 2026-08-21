# Command: pipeline

Design and write CI/CD workflows with truthful gates (`domains/pipelines.md` is the authority).
The signature build command of this skill.

## Steps

1. Take the release plan from `shape` (or the request) and the gate stack it defines.
2. Write the workflow in the boring shape — start from `assets/workflow.example.yml` (the
   canonical stage order, concurrency groups, lockfile discipline, digest-pinned deploys).
   If the target is a specific CI platform, load its sheet in `reference/platforms/` first
   (github-actions, gitlab, jenkins) — the platform's primitives for the boring shape:
   - Fast validation first (lint, types — seconds), then tests, then build, then scan, then
     deploy, then verify (`domains/pipelines.md`).
   - One artifact built once, promoted unchanged (`domains/builds.md`).
   - Gates that **fail the build** on violation, with logs that explain the red
     (`domains/gates.md`).
3. Enforce determinism in the steps: installs from lockfiles (`npm ci`-style), toolchains pinned,
   no `curl | sh`, no `:latest` (`domains/builds.md`).
4. Wire secrets by reference only — the platform's secret store, per-environment scoped, never
   echoed (`domains/config.md`).
5. Guard destruction: deploy-to-prod steps carry the approval and the rollback reference; any
   destructive op is approval-gated (`domains/recovery.md`, `domains/infra.md`).
6. Verify: gate the file first (`node <skill-dir>/scripts/ci-check.mjs --pipeline <file>
   --strict` — the floor as a mechanical gate), then run the pipeline on a branch — red fails
   for the right reasons, green means the artifact is deployable. Quote the pipeline minutes
   before/after.

## Exit criteria

- The workflow follows the stage shape with truthful gates; the artifact is built once; secrets
  referenced; destruction guarded; the run recorded green with a real artifact.

## Rules

- The pipeline is code — it ships as a reviewed PR, deploy-path changes flagged for extra
  scrutiny (`ship-floor.md` #10).
- Never mask red while writing a pipeline: a step that can't pass yet is either fixed or omitted
  with a ticket — not `|| true` (`ship-floor.md` #3).
