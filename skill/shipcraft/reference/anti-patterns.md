# Anti-patterns: the delivery-slop tells

The fingerprints of a delivery system built by an agent (or a team) that never had to roll back at
2 a.m. Each is a defect — not always an outage today, always an outage invitation. Most have a
deterministic rule in `scripts/check.mjs`; the rest are LLM-judged with this file loaded.

## Pipeline honesty tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| H1 | Red masks (`|| true`, `|| exit 0`, `continue-on-error: true`) | The gate lies; the build passes while the check fails | Remove the mask or remove the step; a reason comment if it must stay |
| H2 | Gates that notify but pass | The team learns to ignore the notification | The gate fails the build (`gate`) |
| H3 | Pipeline-level retries on test steps | The flake still exists, now slower (`testcraft` agrees) | Root-cause the flake (`autom`) |
| H4 | `curl \| sh` install steps | Executes the internet with your CI's permissions | Pinned, checksummed artifacts (`builds.md`) |
| H5 | Manual-only steps nobody else can run | Bus factor one; the deploy dies with the author | Everything in the repo, runnable by anyone with review |

## Determinism tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| D1 | `npm install` / unpinned installs in CI | The lockfile is ignored; versions drift run-to-run | `npm ci` / frozen installs / the lockfile discipline |
| D2 | `:latest` tags in images | "Latest" is a different image tomorrow | Pinned versions, content digests, immutable artifacts |
| D3 | Rebuilds between stages (test ≠ ship artifact) | The thing tested isn't the thing deployed | Build once, promote the artifact (`builds.md`) |
| D4 | Manifests without committed lockfiles | Every install is a lottery | Lockfiles committed, updated by PR |

## Secrets tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| S1 | Secrets echoed/printed in CI (`echo $TOKEN`, `printenv`) | The build log is a credential store | Reference by name; never print (`config`) |
| S2 | Secrets in pipeline text (committed to the repo) | Grep finds it; history keeps it | The pipeline's secret store, injected at runtime |
| S3 | Secrets baked into images/artifacts | The artifact leaks forever, everywhere it's copied | Inject at runtime; scan artifacts before release |

## Environment tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| E1 | "Works on my machine" (envs diverge by hand) | The drift is the incident, discovered in prod | One described state; drift detection (`env`) |
| E2 | Snowflake servers (hand-tweaked, un-reproducible) | The fix dies with the person who applied it | Infrastructure-as-code, reconciled (`infra`) |
| E3 | Config copy-pasted per environment with drift | Three near-identical configs, three truths | One template + per-env deltas, generated |
| E4 | Prod secrets available in dev pipelines | A dev compromise is a prod breach | Per-environment scoped secrets (`seccraft` agrees) |

## Deploy tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| P1 | Deploys without rollback | The promise nobody can keep | The revert path, automated and rehearsed (`rollback`) |
| P2 | Rollback never rehearsed | At 2 a.m. the runbook meets reality | Dry-run the rollback on staging (`rollback`) |
| P3 | Deploy = git push to prod (no gates, no health check) | The production server is a surprise box | Pipeline → staged deploy → health check → promote (`deploy`) |
| P4 | No deploy observability (who shipped what, when, and did it break) | Incidents start with archaeology | Deploy logs, health before/after, DORA metrics (`monitor`) |
| P5 | DB migrations coupled blindly to deploys | The rollback can't undo the schema | Expand/contract migrations (`dbcraft` agrees); deploy/rollback pairs aware of schema |

## Infra tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| I1 | Infrastructure in a wiki, applied by hand | Reality drifts from the doc; the doc lies | Declarative IaC, versioned, reconciled (`infra`) |
| I2 | `terraform destroy`/`kubectl delete`/`rm -rf` without approval gates | One typo deletes production | Guarded, approved, reversible operations |
| I3 | IaC drift never detected | The repo says one thing, prod another | Drift detection in CI (`env`) |

## Detector mapping

`scripts/check.mjs` deterministically catches, with these rule ids: `secret-echo` (S1),
`pipe-to-shell` (H4), `masked-failure` (H1, reason-comment escape hatch), `pipeline-retry` (H3,
file-context), `unpinned-install` (D1), `latest-tag` (D2), `force-flag` (H1-adjacent),
`destructive-op` (I2, approval-reference escape hatch), `deploy-without-rollback` (P1), plus
`no-ci-config` and `missing-lockfile` (project-level). The rest are LLM-judged — keep this file
loaded when auditing or reviewing.
