# Command: audit

Defect scan: red masks, flaky steps, secrets, environment drift, and untested rollback. Finds and
ranks — it does not fix. No pipeline or infra edits.

## Steps

1. Run `scripts/check.mjs --target <path>` for the deterministic set (secret echoes, curl|sh,
   red masks, pipeline retries on tests, unpinned installs, latest tags, force flags,
   destructive ops, deploy steps without rollback references, missing CI config, missing
   lockfiles). For a single workflow/pipeline, `scripts/ci-check.mjs --pipeline <file> --strict`
   gates that one file with the same vocabulary, step by step (`reference/commands/ci-check.md`).
2. Inspect what the checker can't see:
   - **Honesty** (`domains/gates.md`): gates that notify vs block; warning-mode-forever; flaky
     gates with retry habits.
   - **Determinism** (`domains/builds.md`): rebuilds between stages; runner-disk dependence;
     uncached-but-unpinned toolchains.
   - **Secrets** (`domains/config.md`): values in pipeline text, baked into artifacts, shared
     across environments.
   - **Environments** (`domains/environments.md`): parity contracts missing; copied configs;
     snowflake servers; drift detection absent.
   - **Recovery** (`domains/recovery.md`): deploys without revert paths; rollbacks never
     rehearsed; schema-coupled irreversible deploys.
   - **Observability** (`monitor`): deploy logs, DORA metrics, smoke tests — present or folklore.
3. Apply the Friday test to the delivery system (`ship-floor.md` Reflexes): every "no" is a
   finding with the fix named.
4. Output a ranked punch list: severity (Blocker / Major / Minor / Nit), file:line or job name,
   rule, and the fix. Blockers = ship-floor violations. Sort by severity, then by blast radius.

## Rules

- Cite the exact step/file/job for every finding — never vague impressions.
- Audit does not edit. The fix is a follow-up command (`autom`, `deploy`, `rollback`, `env`,
   `config`, `gate`...).
- End with a one-line verdict and counts per severity.
