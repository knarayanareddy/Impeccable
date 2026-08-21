# Command: fix

The minimal fix: root cause, one change, verified against the repro (`domains/fixes.md` is the
authority). The moment the diagnosis becomes code — and the moment most bugs escape again, if
this is done hastily.

## Steps

1. State the broken assumption from `diagnose`/`minimize` ("we assumed emails are unique") and
   the fix that corrects *the assumption*, not its symptoms.
2. Write the minimal change — one commit-sized edit at the assumption's location. If the fix
   must be large, the cause isn't understood yet: back to `minimize`, not to a bigger patch
   (`evidence-floor.md` Reflexes).
3. Verify against the repro: fails before, passes after (`evidence-floor.md` #1) — then run the
   suite (the fix's blast radius is the regression's candidate space).
4. State the blast boundary: what was deliberately not changed (`domains/fixes.md`).
5. Ship the pin in the same change: the exact input, the expected behavior, the bug link
   (`pin`) — a fix without its pin is a bug on parole.
6. Clean the scaffolding (`cleanup`) before merge: no prints, no debug flags, no disabled code.

## Exit criteria

- The assumption corrected at its origin; the repro verified before/after; the suite green; the
  pin shipped in the same change; the scaffolding cleaned.
- The record's closure contract holds: `node <skill-dir>/scripts/repro-check.mjs --bugs
  <records>` passes — root-cause and pin present, the rung cited
  (`reference/commands/repro-check.md`).

## Rules

- Fix the cause or don't fix — a symptom patch is interest on the debt
  (`domains/fixes.md`).
- One bug per fix: a second cause found mid-fix becomes its own pass with its own repro.
- A fix that doesn't verify reverts — the attempt is recorded, the branch is not the graveyard.
