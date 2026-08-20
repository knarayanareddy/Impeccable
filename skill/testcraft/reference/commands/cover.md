# Command: cover

Close high-value coverage gaps, risk-ranked (`domains/coverage.md` is the authority). The anti-
number-chase command: gaps are cases, not percentages.

## Steps

1. Map the risk tiers (from TESTS.md or the domain itself): Tier-1 = money, auth, data integrity;
   Tier-2 = core workflows; Tier-3 = formatting, internal utils.
2. Measure per-tier coverage (not one global number) and list the *behavioral* gaps: which cases
   are missing per area (`cases.md`), which error paths and boundaries have no test.
3. Rank by risk × likelihood of regression: Tier-1 gaps first, bug-history areas next, everything
   else last. The ranked list is the output that matters — the percentage is the thermometer,
   not the diagnosis.
4. Close gaps with cases at the cheapest proving level — never by writing tests that merely
   execute lines (`suite-floor.md` #1). Each new test names its case.
5. For Tier-1 areas, run mutation testing (or the strictest equivalent available) and add cases
   for every surviving mutant that matters — this is assertion-quality coverage, the real thing.
6. Set or adjust the per-tier floors in TESTS.md from what the pass learned; wire the CI
   coverage gate per tier, not per whole-repo average.

## Exit criteria

- The ranked gap list closed (or explicitly deferred with dates); per-tier floors recorded and
  gated; mutation run on Tier-1 with surviving mutants triaged.

## Rules

- Never chase 100% repo-wide; never `istanbul ignore` without a written reason; never count
  lines executed as promises kept.
- A coverage gate without a reviewed-meaningful-test rule is theater — pair the gate with the
  review habit (PRs explain deletions of meaningful tests).
