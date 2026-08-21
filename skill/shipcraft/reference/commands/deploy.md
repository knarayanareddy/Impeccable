# Command: deploy

The deploy pass: strategy, health checks, and the checklist (`domains/deploys.md` is the
authority). Turns deploys from a moment of courage into a boring checklist — the whole point.

## Steps

1. Confirm the deploy contract for the target: the exact artifact (digest), the config delta,
   the environment and its parity status, the strategy from `shape`/SHIP.md.
2. Walk the checklist before rollout:
   - Gates green: the artifact passed its stage gates (`domains/gates.md`).
   - Rollback armed: the revert path and trigger exist *for this deploy*
     (`domains/recovery.md`). In doubt, run the decision daemon on the step inventory
     (`reference/commands/pipeline-review.md`) and fix every flag before rollout.
   - Health checks defined: journey-level, gating the rollout (`domains/deploys.md`).
   - The log is ready: who, what commit, to where — recorded as the deploy starts (`monitor`).
3. Execute per the strategy: staged rollout (canary → monitor → widen; or rolling batches), each
   step gated on the health of the previous.
4. Verify post-deploy: the smoke tests, the error rate, the SLO burn (`obscraft`'s burn view) —
   and the rollback trigger remains armed for the observation window.
5. Record the deploy in the log: artifact, config delta, strategy, health before/after, and the
   outcome. The 2 a.m. question "what changed?" must answer itself (`monitor`).

## Exit criteria

- The checklist walked and recorded; the rollout gated on health at each step; the deploy logged
  with before/after health; the rollback trigger armed for the window.

## Rules

- Deploy never skips the rollback question — a deploy without an armed revert is not a deploy,
  it's a dare.
- Small and frequent beats large and rare (`domains/deploys.md`): if this deploy changes too
  much to roll back, split it — that's the finding, not a footnote.
- Config changes ride the same checklist as code (`ship-floor.md` Reflexes).
