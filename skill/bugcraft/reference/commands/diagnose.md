# Command: diagnose

Hypothesis-driven diagnosis: one hypothesis, one prediction, falsify cheap
(`domains/diagnosis.md` is the authority). The elimination engine of this skill. No code edits
beyond the experiments the plan approved.

## Steps

1. Take `shape`'s plan (or build it now if the request came without one): candidates with their
   falsifiable predictions, ranked by cost. For the runtime's instruments, load the matching
   sheet in `reference/environments/` (one sheet, never all).
2. Run the tests in order — cheapest first — one at a time, recording each verdict. The
   diagnosis log is the audit trail (`evidence-floor.md` #2).
3. Eliminate: a candidate dies at its first failed prediction. Write the prediction *before*
   the test, so confirmation bias has no room (`domains/diagnosis.md`).
4. When one hypothesis survives: apply the explains-everything gate — it must account for the
   weird details, not just the headline symptom (`evidence-floor.md` #3). If it doesn't, the
   real cause is still on the list.
5. Deliver the verdict: the surviving cause stated as a broken assumption ("we assumed X"),
   with the evidence level cited (`domains/evidence.md`), and the handoff — `minimize` to
   shrink the proof, `fix` to kill it.

## Exit criteria

- The cause named as a broken assumption, explained against every observation, evidence level
  cited; the diagnosis log complete.

## Rules

- Diagnose ends at understanding — the fix is `fix`'s job. A diagnosis that skips to code is a
  guess that found a stage.
- Theories never outrank observations (`domains/evidence.md`): when they disagree, the theory
  loses.
- If the surviving hypothesis is "it's environmental" — that's a valid diagnosis; the fix is
  in `repro`'s environment protocol, not in the code.
