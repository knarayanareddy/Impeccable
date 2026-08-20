# Command: audit

Defect scan: bugs, dead code, TODO sprawl, suppressions, and floor violations. Finds and ranks — it
does not fix. No code edits.

## Steps

1. Run `scripts/check.mjs --target <path>` for the deterministic set (magic numbers, swallowed
   errors, debug statements, `any`, suppressions, loose equality, `var`, commented-out code, deep
   nesting, long files, TODO density, vague signature names).
2. Read the target for what the checker can't see:
   - **Correctness:** off-by-one, null/nil paths, race conditions, partial failures, wrong error
     scope, mutation during iteration, time/timezone handling.
   - **Dead code:** unreachable branches, unused params/variables/imports, functions with no callers
     (confirm with search before claiming).
   - **Contract drift:** doc comments and names that no longer match behavior.
   - **Structure:** cohesion, cycles, grab-bag modules, change coupling (`domains/structure.md`).
3. Check suppressions: every `@ts-ignore`/`eslint-disable`/`noqa` must name its rule and reason —
   unexplained ones are findings, not excuses.
4. Check the build/test/lint health: do the project's gates pass on the target? A craft audit still
   reports a red gate.

## Output

Ranked findings, each with: severity (Blocker / Major / Minor / Nit), file:line, the rule or defect,
and the concrete fix. Blockers = quality-floor violations. Sort by severity, then by reader impact.

## Rules

- Cite file:line for every finding; never vague impressions.
- Audit does not edit — the fix is a follow-up command (`simplify`, `flatten`, `harden`...).
- End with a one-line verdict and counts per severity.
