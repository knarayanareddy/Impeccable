# Command: migrate (review daemon mode)

Interactive migration review: serve the migration's steps as a decision page and let the human
verdict each against the review checklist — the review-before-production-data gate, in the
browser. The daemon mode of `migrate`; the checklist itself is `domains/migrations.md`'s.

## Protocol

1. The agent reads the migration files and writes a steps file (one entry per migration):

   ```json
   [ { "name": "001_add_currency", "up": "ALTER TABLE orders ADD COLUMN currency …",
       "down": "ALTER TABLE orders DROP COLUMN currency", "reversible": true,
       "lockImpact": "none", "backfill": "UPDATE orders SET currency = 'USD'" } ]
   ```

2. Serve and wait:

   ```bash
   node <skill-dir>/scripts/migration-review.mjs --steps steps.json --round r1 --port 8775 &
   node <skill-dir>/scripts/migration-review.mjs --round r1 --wait --timeout 900
   ```

3. The human verdicts each step — Approve / Flag / N/A (abstain). `--wait` prints the recorded
   verdicts; flagged steps become the worklist: the checklist items they failed (down missing,
   destructive, lock risk, backfill unhandled) are the findings.

## Notes

- Flagged means "this step fails the migration checklist" — the agent fixes the migration,
  never the verdict.
- Every step needs a verdict before the page records; last submission wins (consume once).
- Trusted network only; the daemon binds 0.0.0.0 for preview/tunnel use and serves a decision
  page, not an API.
