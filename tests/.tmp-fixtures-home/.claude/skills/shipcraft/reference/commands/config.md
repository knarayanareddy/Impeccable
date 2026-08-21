# Command: config

Secrets and configuration in the pipeline (`domains/config.md` is the authority). The pass that
moves credentials out of text and config onto the same reviewed, reversible path as code.

## Steps

1. Inventory the secrets and config in the delivery system: pipeline text, artifact build steps,
   environment configs, and how each environment's values differ.
2. Fix the secrets per the rules:
   - **Reference, never write** — pipeline text uses the platform's secret references
     (`${{ secrets.X }}`), values live in the store, scoped per environment
     (`domains/config.md`).
   - **Never echo** — no `echo $TOKEN`, no `printenv`, no config dumps; the build log is not a
     credential store (`anti-patterns.md` S1).
   - **Never bake** — secrets inject at runtime; artifacts are scanned for leaks before release
     (`anti-patterns.md` S3).
   - **Scope and rotate** — per-environment secrets; the rotation path rehearsed (`seccraft`'s
     secrets domain is the authority).
3. Converge the config: one template with generated per-environment deltas, schema-validated in
   CI, applied through the pipeline with the same review and rollback as code
   (`domains/config.md`).
4. Verify: a planted secret in a step is caught by the scan (or at least never echoed); the
   config validates in CI; the config delta shows in the deploy log (`monitor`).

## Exit criteria

- Zero secrets in pipeline text or artifacts; references scoped per environment; config
  validated and diffable; the planted-secret check passes.

## Rules

- Config fixes the values' handling; it doesn't redesign the environments (`env`'s scope).
- A config change is a deploy (`ship-floor.md` Reflexes): same gates, same rollback — and the
  prod hotfix gets captured into the repo in the same hour.
- Never trade security for convenience in the pipeline — the "quick echo for debugging" is how
  the log becomes the breach.
