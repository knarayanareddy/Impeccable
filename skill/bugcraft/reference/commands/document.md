# Command: document

Record the bug's story: symptom, cause, fix, prevention (`domains/learning.md` is the
authority). The bug's gravestone — written so the next engineer finds it *before* re-diagnosing.

## Steps

1. Collect the story's pieces from the pass: the symptom (in the user's words and the error's),
   the repro (link to `repro`'s artifact), the cause (the broken assumption), the fix (the
   commit), the pin (the test), and the class fix (from `postmortem`).
2. Write the record where the team actually looks — the tracker for the bug's own entry, the
   docs/ADR-style notes for the class lesson — in the bug's evidence terms (`domains/evidence.md`).
3. Make it searchable by both ends: by *symptom* (what the user saw — "checkout totals $0 for
   duplicate items") and by *class* (what broke — "assumption: order items are unique").
4. Link the chain: symptom → repro → cause → fix → pin → class fix — one entry, the whole
   story, no archaeology required.
5. Verify: a stranger (or an agent) searching the symptom finds the record in one query.

## Exit criteria

- The story recorded, searchable by symptom and class, with the full chain linked; the
  tracker/doc location consistent with DEBUG.md's conventions.

## Rules

- Document the *class lesson*, not just the instance — the next bug will rhyme with this one,
  not repeat it exactly.
- Evidence terms, not vibes: the record cites the repro, the pin, and the verified fix
  (`domains/evidence.md`).
- If the team's convention already captures this (tracker fields + postmortem), don't duplicate
  — link, and add only what's missing.
