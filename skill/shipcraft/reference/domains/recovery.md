# Domain: Recovery

Recovery is the deploy's second half: the rollback that makes every deploy a promise the team can
keep. The rule: **rollback is a feature, shipped and rehearsed — not a document.**

## The rollback contract

Every deploy pairs with a rollback that states:
1. **The trigger** — the measurable condition that fires it (health check fails, error rate > X
   for Y minutes, the smoke test red).
2. **The mechanism** — the one command (or one click) that reverts: previous image digest,
   previous config, previous IaC state.
3. **The blast boundary** — what the rollback does *not* undo (the DB migration, the data
   written) and what must happen for those instead.
4. **The verification** — how the team knows the rollback worked (the same health checks, green
   again).

## The rehearsal rule

- **Rollback is rehearsed, not documented** (`ship-floor.md` Reflexes): the rollback runs in
  stage on a schedule (or before risky releases) — the runbook meeting reality *before* 2 a.m.
- The rehearsal produces numbers: time-to-rollback, steps that failed, runbook corrections. A
  rollback that takes 40 minutes is a design problem, not an operational detail.

## The database problem (rollback's hard half)

- Code rolls back in seconds; schemas don't. The answer is **expand/contract migrations**
  (`dbcraft`'s migrations domain is the authority): each deploy's schema change is
  backward-compatible, so the old code keeps working after rollback.
- Destructive schema changes are split: add, dual-write, migrate, switch, drop-later — never a
  deploy that can't be undone because the schema moved on (`anti-patterns.md` P5).

## Roll-forward (the honest alternative)

- Sometimes reverting is worse than finishing (a migration mid-flight, a data fix). Roll-forward
  is a *chosen* strategy with its own runbook — decided before the deploy, not improvised during
  the incident.
- The choice is recorded in the deploy log: "rollback: revert to digest X" or "roll-forward:
  complete the migration, then ship the fix" (`monitor`).

## The failed-deploy loop (`respond` runs it)

Detect (the health signal) → contain (pause rollout) → decide (rollback or roll-forward) →
execute (the rehearsed path) → verify (health green) → learn (the postmortem updates the
runbook). Every step exists before the incident.

## Bans (recap)

Deploys without revert paths, untested runbooks, schema-coupled irreversible deploys, improvised
roll-forward, rollback time unmeasured.
