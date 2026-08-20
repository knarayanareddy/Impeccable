# Command: dedupe

Remove duplication without over-abstracting (`domains/duplication.md` is the authority). Duplication
is a question — this command answers it, per case, honestly.

## Steps

1. Find the copies (checker + inspection): repeated blocks ≥ 6 lines, repeated rules expressed
   differently, parallel types mirroring each other.
2. Classify each candidate:
   - **Same reason to change?** If yes → extract. If no (looks alike, will diverge) → leave it and
     say why in the report. Honest non-actions are output, not failure.
   - **Mechanical / structural / knowledge / interface** duplication (see the domain file) → the
     fix differs per class.
3. For each extract:
   - Name the abstraction by its job, not its shape (`formatCurrency`, not `processNumber`).
   - Parameterize the varying edges; no boolean flags (`functions.md`).
   - Re-fit all call sites; if one needs a special case that doesn't fit, you sliced wrong — back
     up a step and re-slice.
   - Delete the copies; add/pin one test for the shared behavior.
4. For knowledge duplication, make the single source of truth and update the re-expressions to call
   it — this one is never optional.
5. Verify: tests green, check.mjs clean, diff reads "moved into one, called from three".

## Guardrails

- Rule of three: two occurrences is a note, not a mandate. Extracting at two creates the wrong
  abstraction half the time.
- Never DRY test code into shared cleverness — tests are documentation and must stay independently
  readable.
- The wrong abstraction costs more than the duplication: when in doubt, leave the duplication and
  write the doubt in the report.

## Exit criteria

- Each duplicate either extracted (with a named abstraction), left (with a written reason), or
  resolved as knowledge duplication (single source of truth).
- Behavior identical; the report lists what was merged and what was deliberately left.
