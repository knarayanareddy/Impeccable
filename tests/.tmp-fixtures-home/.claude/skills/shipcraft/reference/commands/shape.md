# Command: shape

Plan the release before building: what ships, how it rolls out, and how it rolls back. Delivery
shaped early is a boring deploy; retrofitted, it's a 2 a.m. improvisation.

## Steps

1. Restate the release as its parts: code changes, config changes, schema changes, infrastructure
   changes — each with its risk class (routine / risky / destructive).
2. Decide per part:
   - **Deploy strategy** (`domains/deploys.md`): rolling for routine, blue-green/canary for
     risky, feature flags where behavior decouples from deploy.
   - **Rollback contract** (`domains/recovery.md`): the trigger, the mechanism, the blast
     boundary — especially for the schema change (expand/contract, so rollback keeps working).
   - **Health checks** (`domains/deploys.md`): the journey-level checks that gate the rollout.
3. Define the gate stack for this release (`domains/gates.md`): which checks must hold at
   merge, at deploy, and after deploy (smoke).
4. Write the deployment runbook skeleton: the steps, the approval points, the rollback command,
   the verification — this becomes the `deploy`/`respond` material.
5. Deliver: release parts → strategy/rollback/health per part → gate stack → runbook skeleton,
   and wait for approval before writing pipelines.

## Rules

- Shape never edits pipeline or infra. It ends where `pipeline` and `deploy` begin.
- Every part names its rollback — a part without a revert path is a finding, not a plan.
- The schema change gets special treatment: expand/contract or an explicit, approved
  irreversible decision (`dbcraft`'s migrations domain is the authority).
