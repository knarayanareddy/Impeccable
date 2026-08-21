# Command: pipeline-review (decision daemon)

Interactive pipeline review: serve the deploy steps as a decision page and let the human
verdict each — **ship / flag / n-a** — against the recovery and risk contracts. The daemon
mode of `review` and `deploy`: the Friday question ("would you ship from this pipeline at
4:55 p.m.?") gets an auditable, recorded answer; flagged steps become the worklist.

## Protocol

1. Write the steps file (one entry per deploy step; the agent fills it from the pipeline):

   ```json
   [ { "name": "deploy-prod", "job": "deploy", "run": "./deploy.sh",
       "risk": "high", "rollback": "./rollback.sh --previous-image",
       "approval": "prod requires maintainer review" },
     { "name": "smoke-test", "job": "verify", "run": "./smoke.sh", "risk": "low" } ]
   ```

2. Serve and wait:

   ```bash
   node <skill-dir>/scripts/pipeline-review.mjs --steps steps.json --round r1 --port 8797 &
   node <skill-dir>/scripts/pipeline-review.mjs --round r1 --wait --timeout 900
   ```

3. The human verdicts each step; red gap callouts show what's missing:
   - `gap: no rollback reference` — the deploy promise nobody can keep (`ship-floor.md` P1).
   - `gap: high-risk without approval reference` — a destructive step nobody gated (I2).

`--wait` prints the recorded verdicts; flagged steps become the worklist for `rollback`
and `deploy`.

## Notes

- Every step needs a verdict before the page records; last submission wins (consume once).
- Trusted network only; the daemon binds 0.0.0.0 for preview/tunnel use and serves a
  decision page, not an API. A port collision exits 2 with a clear message.
- `risk` is `low|medium|high`; a wrong value is refused at load.
