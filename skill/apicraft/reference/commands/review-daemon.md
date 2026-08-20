# Command: review (daemon mode)

Interactive contract review: serve the spec's endpoints as a decision page and let the human
verdict each from the consumer's seat. The daemon mode of the review command — the scoring
playbook is `commands/review.md`'s scorecard; this page collects the per-endpoint verdicts.

## Protocol

```bash
node <skill-dir>/scripts/review.mjs --spec openapi/openapi.yaml --round r1 --port 8770 &
node <skill-dir>/scripts/review.mjs --round r1 --wait --timeout 900
```

The page lists every operation (method, path, operationId, summary, deprecated); the user marks
each **Approve** or **Flag**. `--wait` prints the recorded verdicts; flagged endpoints become
the worklist for `contract`, `align`, or `harden`.

## Notes

- Flagged means "from the consumer's seat, this promise is unclear" — the agent turns flags
  into findings with the review scorecard, not mechanical edits.
- Every endpoint needs a verdict before the page records (`--result` reflects that).
- Trusted network only; the daemon binds 0.0.0.0 for preview/tunnel use and serves a decision
  page, not an API.
