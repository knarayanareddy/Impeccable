# Command: shape

Plan a change before writing it. Shape owns intent and design; it writes no implementation code.

## Steps

1. Restate the change as a contract: "Given [current behavior], after this change [new behavior].
   Must not change: [everything else]." If the contract can't be stated, ask — never guess.
2. Read the code the change touches plus its tests and callers. Map the blast radius: what imports
   it, what it depends on, what conventions bind it (from CODEBASE.md).
3. Decide the shape:
   - Where does the change live (which module/function owns it)?
   - What's the minimal diff: rename? extract? new function? new module?
   - What are the edge cases and error paths (domains/errors.md)?
   - What test pins the old behavior, and what test pins the new one?
4. Choose the approach — the simplest one that meets the contract. If two approaches are close,
   present both in two sentences and pick per codebase conventions.
5. State the verification plan: which tests/types/formatting run, what the checker should report.

## Deliverable

A short plan: contract → blast radius → shape → approach → verification. No implementation code.
Present it and wait for approval before coding.

## Rules

- Shape never edits code. It ends where implementation begins.
- Respect frozen zones and local conventions from CODEBASE.md.
- If the change is large, propose slicing it into reviewable steps — a plan nobody can review is not
  a plan.
