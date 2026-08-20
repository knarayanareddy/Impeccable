# Command: slo (review daemon mode)

Interactive SLO/alert review: serve the definitions as a decision page and let the human
verdict each against its contract — the SLO's quartet, the alert's actionability. The daemon
mode of `slo` and `alert`; the scoring playbooks are those commands' own.

## Protocol

1. Write the review file (one entry per definition; `kind` is `slo` or `alert`):

   ```json
   [ { "kind": "slo", "name": "checkout-availability",
       "facts": "99.9% complete < 3s over 30d", "owner": "payments-team" },
     { "kind": "alert", "name": "CheckoutFastBurn",
       "facts": "burn rate 2%/1h", "owner": "payments-team",
       "runbook": "runbooks/checkout-burn.md" } ]
   ```

2. Serve and wait:

   ```bash
   node <skill-dir>/scripts/slo-review.mjs --review review.json --round r1 --port 8796 &
   node <skill-dir>/scripts/slo-review.mjs --round r1 --wait --timeout 900
   ```

3. The human verdicts each entry — **approve / flag / n-a** — with missing owner/runbook
   shown in red on the page. `--wait` prints the recorded verdicts; flagged entries become
   the worklist for `slo`/`alert`.

## Notes

- Every entry needs a verdict before the page records; last submission wins (consume once).
- Trusted network only; the daemon binds 0.0.0.0 for preview/tunnel use and serves a
  decision page, not an API. A port collision exits 2 with a clear message.
