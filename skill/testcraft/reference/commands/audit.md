# Command: audit

Defect scan: skipped and focused tests, sleeps, weak assertions, and isolation violations. Finds
and ranks — it does not fix. No test edits.

## Steps

1. Run `scripts/check.mjs --target <path>` for the deterministic set (focused tests, skipped
   tests, empty tests, tautological assertions, sleeps, unseeded randomness, retry masks, network
   in test files, files with tests but no assertions).
2. Inspect what the checker can't see:
   - **Honesty:** tests that can't fail (circular mocks, assert-on-mock-only, existence-only
     checks) — `anti-patterns.md` H4/H5.
   - **Coupling:** tests referencing internals; tests that would break under behavior-preserving
     refactors (`domains/units.md`).
   - **Isolation:** shared mutable state, order dependence, per-test data collisions
     (`domains/determinism.md`).
   - **Level honesty:** unit tests with real I/O; E2E proving what units prove
     (`anti-patterns.md` L1–L4).
   - **Skip debt:** every skip with a reason/owner/tracker vs skips that just accumulated.
3. Check the CI wiring: are focused/skipped tests blocked at the gate, or only at review-time
   memory? (A CI that doesn't block `.only` is a finding, not a config detail.)
4. Output a ranked punch list: severity (Blocker / Major / Minor / Nit), file:line, rule, and the
   fix. Blockers = suite-floor violations. Sort by severity, then by how often the test runs.

## Rules

- Cite file:line for every finding; never vague impressions.
- Audit does not edit. The fix is a follow-up command (`strengthen`, `isolate`, `prune`,
   `flaky`...).
- End with a one-line verdict and counts per severity.
