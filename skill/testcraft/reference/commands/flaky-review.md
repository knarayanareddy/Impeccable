# Command: flaky (review daemon mode)

Interactive flake triage: serve the flakiest tests (from CI retry history) as a decision page
and let the human verdict each against the determinism taxonomy. The daemon mode of `flaky`;
the root-cause discipline is that command's playbook (`domains/determinism.md`).

## Protocol

1. The agent writes the flake list from CI history (retry logs, quarantine board):

   ```json
   [ { "test": "checkout > rejects expired card", "file": "src/checkout.test.ts",
       "failures": 4, "lastRun": "2026-08-20T09:12:00Z", "suspected": "time" } ]
   ```

2. Serve and wait:

   ```bash
   node <skill-dir>/scripts/flake-review.mjs --flakes flakes.json --round r1 --port 8780 &
   node <skill-dir>/scripts/flake-review.mjs --round r1 --wait --timeout 900
   ```

3. The human verdicts each flake — **fix now / quarantine + ticket / known external /
   cannot reproduce / n/a** (cannot-reproduce is the honest state between quarantine and fix —
   the `flaky` command's reproduce-first gate owns what happens next)
   (retry-masking is deliberately not on the menu). `--wait` prints the recorded verdicts;
   `fix-now` entries become the root-cause worklist for `flaky`, `quarantine-ticket` entries
   get their ticket with the quarantine honored — silently quarantined forever is still a
   finding.

## Notes

- The verdict maps to the taxonomy: `suspected` is a hypothesis the root-cause pass proves or
  kills — the page records the *triage*, the `flaky` command records the *fix*.
- Every flake needs a verdict before the page records; last submission wins (consume once).
- Trusted network only; the daemon binds 0.0.0.0 for preview/tunnel use and serves a decision
  page, not an API.
