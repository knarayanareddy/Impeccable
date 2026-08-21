# Command: review

Judgment review with scoring — the pass `audit`'s defect scan can't do alone. The one question:
**could the next bug in this system be found, from the evidence the system keeps?** No edits.

## Scorecard (1–5 each)

| Dimension | The question |
|---|---|
| Evidence culture | Do fixes cite reproductions and verifications (`evidence.md`)? |
| Error quality | Would the 3 a.m. engineer find the cause from the error alone (`errors.md`)? |
| Traceability | Can one request's story be followed end to end (`tooling.md`)? |
| Repro-ability | Can any bug be reproduced locally with production-shaped data (`reproduction.md`)? |
| Fix discipline | Are fixes minimal, root-caused, and pinned (`fixes.md`)? |
| Class closure | Do bugs close classes, with escape analysis (`learning.md`)? |
| Debuggability of the code | Are the seams observable — boundaries logged, state inspectable (`tooling.md`)? |
| Tooling access | Do engineers have debuggers, profilers, traces, and repro paths (`tooling.md`)? |
| Postmortem culture | Blameless, regular, action-tracked (`learning.md`)? |
| Speed to truth | Measured: time from report to root cause (`measure`)? |

## Steps

1. Walk the last real bug's path from report to fix: which steps had evidence, which had hope,
   which needed the author's memory?
2. Score each dimension with one "what's holding" and one "what's not" line, citing the exact
   error message, log gap, or missing pin — "the fix shipped with no regression test" is a
   citation.
3. Deliver: the scorecard, the three highest-leverage fixes (ranked by future-bug cost), one
   honest strength, and one "bold move" — the single change that would most speed the next
   diagnosis.

For an auditable verdict on the open/fixed bugs themselves, record it with the decision
daemon (`reference/commands/bug-review.md`): close / flag / n-a per bug, the closure gaps in red.

## Rules

- Review the system, not the team: a slow diagnosis is a finding about tooling and evidence,
  not about the engineer's ability.
- A swallowed error, a shipped debug marker, and a fix without a pin are each full findings,
  not dimension nits.
- No edits in review; follow-up commands (`cleanup`, `pin`, `postmortem`, `init`...) pick up
  the ranked list.
