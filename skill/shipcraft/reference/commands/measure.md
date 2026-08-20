# Command: measure

The quantitative pass. Numbers, not adjectives. Complements `review` (judgment) and `audit`
(defects). No edits.

## What gets measured

1. **Pipeline speed** — total minutes per run; per-stage durations; the slowest 5 steps; wait
   time in queues (the hidden half of pipeline latency).
2. **Pipeline truth** — pass rate; flake rate (steps failing intermittently); red-mask count
   (checker); retry counts on test steps.
3. **Delivery frequency** — deploys per week (per environment); median time from commit to prod
   (the lead-time half of DORA).
4. **Change failure rate** — deploys that needed a fix or rollback, last N weeks (DORA).
5. **Recovery** — MTTR per failed deploy; rollback time (measured from rehearsals); rollbacks
   vs roll-forwards.
6. **Environment truth** — drift findings per environment (from the drift detection); snowflake
   count; parity-check pass rate.
7. **Infra hygiene** — IaC coverage (% of infrastructure described in code); unreviewed
   console/hand changes per week.
8. **Secrets posture** — secrets echoed (checker), baked into artifacts (scan), shared across
   environments.

## Output

A measurement report: per-metric tables with numbers, the floor comparison against
`ship-floor.md` and SHIP.md's targets, then the ranked delta list — cheapest change to highest
delivery-risk reduction.

## Rules

- Every number cites its method (pipeline logs / deploy log / drift detection / inspection). If
  a metric can't be measured with available tooling, report "not measured" — never guess.
- Quote before/after numbers around any subsequent pass — that's how delivery craft becomes
  visible.
