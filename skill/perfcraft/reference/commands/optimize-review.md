# Command: optimize (review daemon mode)

Interactive optimization review: serve candidate optimizations as a decision page and let the
human verdict each on its measured receipt — ship / revert / profile-again. The daemon mode of
`optimize`; the bounded loop is that command's playbook.

## Protocol

1. Write the candidates as option files — each carries its before/after numbers (the receipt
   the perf floor demands):

   ```json
   [ { "name": "batch the cart queries", "rationale": "N+1 → 1",
       "before": { "p95": "480ms", "tool": "trace" },
       "after": { "p95": "210ms" },
       "complexity": "one batched query" } ]
   ```

2. Serve and wait:

   ```bash
   node <skill-dir>/scripts/optimize-review.mjs --options options.json --round r1 --port 8790 &
   node <skill-dir>/scripts/optimize-review.mjs --round r1 --wait --timeout 900
   ```

3. The human verdicts each candidate — **ship / revert / profile-again**. `--wait` prints the
   recorded verdicts; `revert` entries get reverted with the measured reason recorded, and
   `profile-again` entries return to the loop with the hypothesis that failed.

## Notes

- **No number, no option**: candidates without before/after measurements are rejected at load
  (perf-floor #1) — the tool refuses bets.
- Every option needs a verdict before the page records; last submission wins (consume once).
- Trusted network only; the daemon binds 0.0.0.0 for preview/tunnel use and serves a decision
  page, not an API.
