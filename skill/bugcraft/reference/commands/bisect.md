# Command: bisect

Isolate the cause: git bisect, half-splitting, one dimension at a time (`domains/bisection.md` is
the authority). The logarithmic search — each step discards half the suspects.

## Steps

1. Confirm the repro is deterministic and fast — bisection only works with an honest probe
   (`domains/reproduction.md`; a flaky repro makes the bisect lie).
2. Choose the dimension by the bug's shape:
   - Regression → git bisect between last-good and first-bad commits; the repro marks each
     checkout good/bad.
   - Data-dependent → input half-splitting: remove half the input, check, recurse.
   - Order/time-dependent → split the event stream (logs, requests, writes) around the
     divergence.
   - Distributed → boundary splitting: test each hop's inputs/outputs until truth diverges
     (`trace` finds it; bisect pins it).
3. Run the search, recording each verdict — the bisection log is the evidence trail
   (`domains/evidence.md`).
4. On landing: the isolated change/input/boundary names the cause candidate — hand it to
   `diagnose` to confirm the hypothesis, or straight to `minimize`/`fix` when the repro already
   tells the story.

## Exit criteria

- The cause isolated to one change/input/boundary, with the bisection log recorded; or the
  empty-handed finding stated (emergent cause — two changes interacting, or the environment).

## Rules

- One dimension at a time — mixing dimensions destroys the halving property
  (`domains/bisection.md`).
- The log is the deliverable's skeleton: an unrecorded bisect is an unrepeatable one.
- A bisect that lands on nothing is a finding, not a failure — it re-points the search
  (`domains/bisection.md`).
