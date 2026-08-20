# Command: cleanup

Remove the debugging scaffolding: prints, debug flags, disabled code (`domains/tooling.md` is the
authority). The crime scene is cleaned before merge — the fix ships as if it was never a mystery.

## Steps

1. Inventory the scaffolding in the target (checker + inspection):
   - Debug markers (`console.log("here")`-family, `debugger;`, print statements)
   - Temporary logging added during the chase
   - Debug flags and environment switches introduced for the investigation
   - Disabled code (`if (false)`, commented-out blocks) left from experiments
   - Scratch files, test-only hacks, and local-only config
2. Remove in one batch, keeping exactly what deserves to stay:
   - Convert genuinely useful temporary logging into proper structured logging at the right
     level (`obscraft`'s logs domain) — or delete it.
   - Keep the regression pin (`pin`) — that's the investigation's permanent artifact.
3. Verify: the checker clean on the target; tests green; the diff reads "investigation removed,
   fix and pin remain".

## Exit criteria

- Zero debug markers, debug flags, or disabled code in the target; useful logging promoted to
  proper form; the pin intact; the checker clean.

## Rules

- Cleanup happens with the fix, not "later" — scaffolding shipped is noise forever
  (`evidence-floor.md` #7).
- Promote-or-delete: temporary logging that stays becomes permanent logging, with the
  structured-log contract (`obscraft`), or it goes.
- The pin is never cleanup fodder — it's the deliverable; everything else from the chase is
  expendable.
