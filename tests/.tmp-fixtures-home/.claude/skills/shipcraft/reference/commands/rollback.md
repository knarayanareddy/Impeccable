# Command: rollback

Make rollback real: the revert path, automated and rehearsed (`domains/recovery.md` is the
authority). The signature recovery move — a deploy is a promise the team can keep only if the
undo button exists and has been pressed.

## Steps

1. Inventory the deployables (from SHIP.md or the pipeline): for each, the current rollback
   state — mechanism, trigger, rehearsal history. The gap list is the work.
2. For each gap, build the contract (`domains/recovery.md`):
   - **Trigger** — the measurable rollback condition (health check fails, error rate > X for Y
     minutes).
   - **Mechanism** — one command/click: previous image digest, previous config, previous IaC
     state.
   - **Blast boundary** — what the rollback does not undo (the schema change, the data written)
     and the plan for those (expand/contract migrations — `dbcraft` is the authority).
   - **Verification** — the health checks that prove the rollback worked.
3. Handle the database half: every schema change in the deploy path is expand/contract, so old
   code keeps working after revert (`anti-patterns.md` P5).
4. **Rehearse on stage**: run the rollback end-to-end, time it, fix the runbook, record the
   numbers. A rollback that has never been run is a document (`ship-floor.md` Reflexes).
5. Schedule the recurring rehearsal (before risky releases at minimum) and wire the rollback
   trigger into the deploy's observation window (`deploy`).

## Exit criteria

- Every deployable has the full rollback contract; the rollback rehearsed on stage with measured
  time; the schema-safe path verified; the recurrence scheduled.

## Rules

- Rollback fixes the recovery path; it doesn't redesign the deploys (`deploy`'s scope).
- Roll-forward is a chosen strategy with its own runbook — decided before the deploy, recorded in
  the log, never improvised (`domains/recovery.md`).
- A rollback that takes 40 minutes is a design problem — the rehearsal's timing is the finding.
