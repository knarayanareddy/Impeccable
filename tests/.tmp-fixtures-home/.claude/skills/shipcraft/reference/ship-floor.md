# Ship floor

Load this file **immediately before editing any pipeline, deploy, or infrastructure config**. It is
the non-negotiable floor, the absolute bans, and the reflexes no detector catches. When the team's
published delivery standards are stricter, theirs win.

## The floor

1. **Every deploy is reversible.** The rollback path exists, is automated, and is tested before the
   deploy that needs it. A deploy whose rollback is a theory is a promise nobody can keep
   (`domains/recovery.md`).
2. **The gate blocks; the log explains.** Quality gates (tests, lint, security scan, build) fail
   the build on violation. A gate that notifies and passes is a lie with a webhook
   (`domains/gates.md`).
3. **Red is never masked.** No `|| true`, `|| exit 0`, `continue-on-error` on critical steps, no
   pipeline-level retries on test steps. A flaky step gets root-caused (`autom`) — masking is the
   incident in waiting.
4. **Deterministic builds.** Lockfiles pinned and committed; CI installs from the lockfile
   (`npm ci`, `pip install -r requirements.lock`-style); images immutable with content digests,
   never `:latest` (`domains/builds.md`).
5. **One source of truth per environment.** Every environment is created from the same described
   state (IaC + config), and drift from that state is detected automatically
   (`domains/environments.md`). Snowflake servers are bugs with uptime.
6. **Secrets never touch pipeline text or logs.** Referenced by name from the pipeline's secret
   store, injected at runtime, never echoed, printed, or baked into artifacts
   (`domains/config.md`).
7. **Artifacts are built once, promoted unchanged.** The thing tested is the thing deployed — no
   rebuilds between stages, no "the release build is a little different" (`domains/builds.md`).
8. **Deploys are observable.** Every deploy: who, what commit, to where, health before/after, and
   the rollback trigger. Deploy frequency, change failure rate, and MTTR are measured (DORA-shaped)
   (`monitor`).
9. **No curl-pipe-to-shell.** Installation steps use pinned, verified, checksum-checked artifacts —
   never `curl … | sh` (`domains/builds.md`).
10. **The pipeline is code, reviewed like code.** Pipeline configs live in the repo, get PR review,
    and changes to deploy paths get extra scrutiny — the deploy path is where outages are born.

## Absolute bans (deterministic — most are caught by `scripts/check.mjs`)

- Echoing/printing secrets in CI steps (`echo $PASSWORD`, `printenv`, env dumps)
- `curl`/`wget` piped to `sh`/`bash`
- Red masks: `|| true`, `|| exit 0`, `continue-on-error: true`, `allow_failure: true` on critical
  steps without a written reason
- Unpinned installs in CI (`npm install` instead of `npm ci`, `pip install` without the lockfile
  discipline)
- `:latest` image tags in pipelines or deploys
- `--force` on git pushes, publishes, or destructive operations
- `rm -rf`, `kubectl delete`, `terraform destroy`, `DROP` in pipeline configs without approval gates
- Pipeline-level retries on test steps (`retry:` / `attempts:` around test jobs)
- No CI configuration anywhere in the project
- Manifests without lockfiles committed

## Reflexes (no detector catches these)

- **The Friday test.** Would you ship from this pipeline at 4:55 p.m. on a Friday? Every "no"
  names a fix: the rollback, the flaky step, the missing gate.
- **Deploy fear is a system smell.** When engineers avoid shipping, the delivery system — not the
  engineers — is broken. The fix is boringness: predictable pipelines, rehearsed rollbacks.
- **The pipeline is a product.** Its users are the team; its SLO is pipeline minutes; its failure
  mode is a blocked or lying pipeline. Treat flaky CI as a P1, not a shrug.
- **Drift is found by detection, not by memory.** If the answer to "does prod match the code?" is
  "I think so", the answer is no — automate the check.
- **Rollback is rehearsed, not documented.** A rollback runbook that has never been run is a
  document. The rehearsal is the test (`domains/recovery.md`).
- **Config changes are deploys.** A config-only change gets the same review, the same gates, and
  the same rollback path as code — config is where the quiet outages live.
- **Every manual step is a future incident.** Steps that only one person can do, environments only
  one person can build, deploys only the author can run — each is a single point of failure with a
  bus factor of one.
