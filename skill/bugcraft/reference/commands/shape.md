# Command: shape

Plan the debug before touching code: evidence, hypotheses, and the order of attack. Debugging
shaped early is elimination; unshaped, it's poking. Shape never edits code.

## Steps

1. Record the evidence as it stands (`domains/evidence.md`): the exact symptom, the exact input,
   the exact error, the timeline, the recent changes (deploy log, diff) — and label the evidence
   level (observation? reproduction?).
2. Enumerate the candidate causes — including the boring ones ("the input was empty", "the
   config didn't load") (`domains/diagnosis.md`).
3. For each candidate, write its falsifiable prediction — the observation that would acquit it.
4. Rank the tests by cost: the cheapest prediction that kills the most candidates runs first.
5. Deliver the plan: evidence table → candidates with predictions → the ordered test sequence →
   the stopping condition (the hypothesis that explains every observation). Wait for approval
   before investigating.

## Rules

- Shape never edits code — it ends where `repro`/`diagnose`/`bisect` begin.
- Every candidate makes a prediction; a candidate that predicts nothing is an opinion, and
  opinions don't get tested.
- If the evidence is too thin for candidates (no error, no repro), the plan is "capture
  evidence" — `repro` first, theories later.

## Exit criteria

- The plan recorded with evidence levels, candidates, predictions, and the ordered attack;
  the stopping condition stated.
