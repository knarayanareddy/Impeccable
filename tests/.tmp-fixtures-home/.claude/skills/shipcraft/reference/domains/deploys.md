# Domain: Deploys

The deploy is the promise the whole delivery system exists to keep. The craft: every deploy is
reversible, observable, and staged — and the strategy is chosen per risk, not per habit.

## The deploy contract (before anything ships)

1. **What** — the exact artifact (digest) and the config delta.
2. **Where** — the environment and its parity status.
3. **How it rolls out** — the strategy (below).
4. **How it rolls back** — the revert path, with its trigger ("roll back if health check fails
   or error rate > X for Y minutes") (`domains/recovery.md`).
5. **How it verifies** — the health checks and smoke tests that gate the rollout.
6. **Who and when** — recorded in the deploy log (`monitor`).

## The strategies (chosen per risk)

| Strategy | Use when | The risk |
|---|---|---|
| Rolling (N at a time) | Routine changes, stateless services | Slower rollback; mixed versions mid-rollout |
| Blue-green | Instant rollback needed; large changes | Doubled capacity; state migration split-brain |
| Canary | High-risk changes, large user bases | Needs real traffic analysis; longer exposure |
| Feature flags | Behavior changes independent of deploys | Flag debt; the flag is now the deploy |

- The strategy is written in the deploy config, not decided at 4:55 p.m.
- Feature flags decouple *deploy* from *release* — ship dark, enable deliberately. The flag has
  an owner and an expiry (`prune` hunts flag debt).

## Health checks (the deploy's proof)

- **Readiness vs liveness** — a service that's up but can't serve is not healthy; readiness
  checks the dependencies the service actually needs.
- **Checks assert the journey, not the port** — "checkout completes" beats "HTTP 200 on /health"
  (`obscraft`'s journey-first doctrine agrees).
- **Rollout is gated on health** — the next instance deploys only if the previous one stayed
  healthy; a failed health check pauses the rollout and fires the rollback trigger.

## Deploy hygiene

- **Deploys are boring** (`ship-floor.md` #2): the best deploy is the one nobody remembers.
  Excitement — heroics, manual fixes mid-rollout — is a process failure.
- **Small and frequent beats large and rare** — the deploy that changes one thing is easy to
  roll back; the monthly mega-release has no revert path and no memory.
- **Config deploys are deploys** — same gates, same rollback (`ship-floor.md` Reflexes): config
  is where the quiet outages live.

## Bans (recap)

Push-to-prod deploys, strategy-less rollouts, port-only health checks, un-gated rollout, mega-
releases with no revert, deploys without a log.
