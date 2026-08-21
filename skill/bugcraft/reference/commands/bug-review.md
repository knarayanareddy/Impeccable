# Command: bug-review (decision daemon)

Interactive bug review: serve the bug records as a decision page and let the human verdict
each — **close / flag / n-a** — against the evidence ladder's closure contract. The daemon
mode of `review` and `document`: "is this bug closed by evidence?" gets an auditable,
recorded answer; flagged bugs become the worklist.

## Protocol

1. Write the bugs file (one entry per bug; the agent fills it from the tracker):

   ```json
   [ { "id": "CHECKOUT-31", "title": "checkout hangs on 3-item carts",
       "status": "fixed", "facts": "N+1 query in the cart loader",
       "repro": "tests/repro-checkout-31.sh",
       "rootCause": "cart items fetched one query per item",
       "pin": "tests/checkout.test.js:31" },
     { "id": "CART-44", "title": "flaky tax rounding", "status": "open",
       "facts": "off by 1 cent on odd rows" } ]
   ```

2. Serve and wait:

   ```bash
   node <skill-dir>/scripts/bug-review.mjs --bugs bugs.json --round r1 --port 8798 &
   node <skill-dir>/scripts/bug-review.mjs --round r1 --wait --timeout 900
   ```

3. The human verdicts each bug; red gap callouts show what's missing:
   - `gap: no repro reference` — the bug isn't real until it reproduces (`evidence-floor.md` #1).
   - `gap: no root-cause reference` (on a fixed bug) — "it works now" is not a conclusion (#8).
   - `gap: no pin reference` (on a fixed bug) — a fix without a regression pin can return (#5).

`--wait` prints the recorded verdicts; flagged bugs become the worklist for `repro`,
`diagnose`, `minimize`, and `pin`.

## Notes

- Every bug needs a verdict before the page records; last submission wins (consume once).
- Bug ids must be unique and the status must be in the vocabulary — both are refused at load.
- Trusted network only; the daemon binds 0.0.0.0 for preview/tunnel use and serves a
  decision page, not an API. A port collision exits 2 with a clear message.
