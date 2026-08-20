# Command: audit

Defect scan of the debugging posture: swallowed errors, debug markers, uncertainty, and error
quality. Finds and ranks — it does not fix. No code edits.

## Steps

1. Run `scripts/check.mjs --target <path>` for the deterministic set (debug markers,
   log-and-swallow, swallowed exceptions, silent catch returns, disabled code, commented-out
   debug lines, uncertainty markers).
2. Inspect what the checker can't see:
   - **Error quality** (`domains/errors.md`): do errors carry operation + subject + cause + fix?
     bare rethrows? codes stable?
   - **Debugging scaffolding** (`domains/tooling.md`): print-debugging habits, debug flags,
     temporary logging that shipped.
   - **Fix hygiene** (`domains/fixes.md`): recent fixes without regression pins; symptom patches
     (fix at the surfacing layer); fixes with no cited verification.
   - **The escape analysis** (`domains/learning.md`): recent production bugs without
     postmortems; class fixes absent.
   - **Traceability** (`domains/evidence.md`): error reports without correlation IDs; deploy
     logs that don't answer "what changed?".
3. Output a ranked punch list: severity (Blocker / Major / Minor / Nit), file:line, rule, and
   the fix. Blockers = evidence-floor violations. Sort by severity, then by how often the code
   path runs.

## Rules

- Cite file:line for every finding — never vague impressions.
- Audit does not edit. The fix is a follow-up command (`fix`, `cleanup`, `pin`,
   `postmortem`...).
- End with a one-line verdict and counts per severity.
