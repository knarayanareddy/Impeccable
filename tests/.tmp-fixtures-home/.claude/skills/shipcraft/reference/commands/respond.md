# Command: respond

Failed-deploy response: the recovery runbook (`domains/recovery.md` is the authority). The pass
that prepares the 2 a.m. rollback — before it's 2 a.m.

## Steps

1. Enumerate the failed-deploy classes: the bad code (works in stage, breaks in prod), the bad
   config, the bad migration, the bad infra change, the dependency gone wrong. Per class, not
   per hypothetical.
2. For each class, write the runbook along the recovery loop: detect (which health signal) →
   contain (pause the rollout) → decide (rollback or roll-forward, by the contract) → execute
   (the rehearsed path) → verify (health green) → learn (the postmortem updates the runbook).
3. Wire the operational bits: who gets paged on a failed deploy, the escalation path, the comms
   template, and the rollback command pinned in the runbook (the exact command, not "revert
   somehow").
4. Dry-run the top class: simulate a failing deploy on stage, execute the runbook end-to-end,
   time it, fix it, record the numbers (`domains/recovery.md`'s rehearsal rule).
5. Close the loop: every stumble in the dry-run becomes a fix in `rollback`, `deploy`, or the
   runbook — recorded, owned, scheduled.

## Exit criteria

- One runbook per failed-deploy class; the dry-run executed with measured time-to-recovery; the
  escalation path confirmed; the gaps ticketed.

## Rules

- Respond prepares the response; it doesn't fix the pipelines (`autom`/`deploy`/`rollback`'s
  scope).
- The decision between rollback and roll-forward is made before the incident (`domains/
  recovery.md`) — the runbook states the default, and the incident picks it, not invents it.
- Every real failed deploy rewrites a runbook — the dry-run teaches the same lesson first.
