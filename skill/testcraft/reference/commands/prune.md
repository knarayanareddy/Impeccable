# Command: prune

Delete tests that pay no rent. A test costs forever (runtime, maintenance, false-confidence
interest) — pruning is how the suite stays worth trusting. The most under-used command in testing.

## The prune list (each item a candidate)

1. **Tautological and empty tests** — can never fail, or assert nothing (`suite-floor.md` #1).
   Delete on sight.
2. **Duplicate tests** — two tests pinning the same contract at the same level; keep the
   clearer, delete the rest.
3. **Obsolete tests** — pinning removed or superseded behavior; git remembers the old test, the
   suite must not (`anti-patterns.md` M4).
4. **Implementation-coupled tests beyond repair** — they'd need a rewrite to test behavior;
   rewrite the one that matters, delete the rest.
5. **Skip debt** — skipped tests with no owner/ticket/plan; convert to a ticket or delete.
6. **Snapshot sprawl** — snapshots pinning nothing meaningful (entire-page dumps, unreadable
   diffs); replace with targeted assertions or delete.
7. **Coverage theater** — tests that exist only to execute lines; delete and re-measure — the
   coverage drop is honest, and `cover` will close real gaps properly.

## Steps

1. Build the candidate list with evidence per candidate (why it pays no rent).
2. Get one confirmation on the list before deleting — pruning is subtraction and the user owns
   the suite's history.
3. Delete in one batch; run the suite; quote the delta: tests removed, duration saved, and the
   honest coverage change.
4. Report what was deliberately kept and why (a borderline duplicate that documents a subtle
   difference stays, with the difference stated).

## Rules

- Never prune by coverage number; prune by rent (the seven criteria above).
- A test that pins a *real* contract is never deleted for being slow or ugly — speedup/strengthen
  are the commands for that.
- When in doubt, keep and annotate — but a doubt that recurs twice is a prune.

## Exit criteria

- The candidate list resolved (deleted or defended), suite green, before/after numbers quoted,
  skip debt converted to tickets or cleared.
