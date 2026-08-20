# Command: postmortem

Learn: why did the bug escape, and what closes the class (`domains/learning.md` is the
authority). The bug is fixed when its *class* is dead — this command kills the class.

## Steps

1. Write the story in evidence terms: symptom, the broken assumption, the fix, the verification
   (`domains/evidence.md` — cite the levels).
2. Answer the escape question specifically: which gate, test, type, error message, or telemetry
   gap let this reach production (or survive)? The answer names the mechanism — "no boundary
   validation in handler.ts:142", "the case was missing from the inventory", "the error was
   swallowed" — never "human error".
3. Choose the class fix — the smallest change that catches the class at its birth: the
   constraint (`dbcraft`), the test case (`testcraft`), the lint rule (`codecraft`), the error
   upgrade (`apicraft`), the gate (`shipcraft`), the telemetry gap (`obscraft`), the boundary
   check (`seccraft`). The class fix ships in the same cycle as the bug fix
   (`evidence-floor.md` #10).
4. Run the sweep: what *else* shares the broken assumption — the same boundary, nullability, or
   pattern elsewhere (`domains/learning.md`). Findings become tickets or fixes.
5. Record the postmortem where the next engineer looks (tracker / ADR-style notes /
   `document`'s output), searchable by symptom and class.

## Exit criteria

- The story in evidence terms; the escape mechanism named; the class fix shipped or ticketed
  with an owner; the sweep recorded; the postmortem filed searchably.

## Rules

- Blameless by construction — the question is "what allowed it", never "who wrote it"
  (`anti-patterns.md` C5). The author is the witness, not the defendant.
- A postmortem without the escape analysis is a diary entry — the class fix is the deliverable.
- The class fix is the cheapest layer that catches the class — not necessarily the fanciest.
