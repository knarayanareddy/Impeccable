# Domain: Configuration & secrets

Config and secrets are the deploy's quiet half — the half where outages actually live. The craft:
secrets referenced, never written; config described, never remembered; and both riding the same
review and rollback path as code.

## Secrets in the pipeline (`config` implements this)

- **Reference by name, inject at runtime.** The pipeline text contains `${{ secrets.PROD_KEY }}`
  or the platform equivalent — never a value. The value lives in the pipeline's secret store,
  scoped per environment (`seccraft`'s secrets domain agrees).
- **Never echo, never print.** No `echo $TOKEN`, no `printenv`, no "dump config for debugging"
  (`anti-patterns.md` S1) — the build log is a credential store unless you deny it the job.
- **Never bake into artifacts** — images and bundles get secrets at runtime via the platform's
  injection; artifacts are scanned for leaked secrets before release (`anti-patterns.md` S3).
- **Per-environment scoping** — dev credentials never unlock prod (`anti-patterns.md` E4); the
  rotation path exists and is rehearsed (`seccraft`'s rotation discipline).

## Configuration as code

- **Config lives in the repo**, versioned with the code it configures — a config-only change is a
  deploy (`ship-floor.md` Reflexes) with the same review and gates.
- **One template, per-environment deltas** — the shared shape in one file, the differences (URLs,
  scale, secrets references) as small generated deltas, never three hand-copied full configs
  (`anti-patterns.md` E3).
- **Validated before applied** — schema-checked, parsed, and dry-run against the environment
  before the real apply. A config that fails at apply time is a pipeline gate missing.
- **Config changes diff like code** — the deploy log shows the config delta (`monitor`), so the
  2 a.m. question "what changed?" answers itself.

## The promotion path

Config promotes with its code: dev → stage → prod through the same pipeline, with the same gates,
and the same rollback (`domains/recovery.md`). A config hotfix applied directly to prod is a
snowflake in the making — capture it into the repo in the same hour, or it will drift forever.

## Bans (recap)

Secrets in pipeline text, echoed values, baked-in secrets, copied configs, unvalidated applies,
prod hotfixes that never make it home.
