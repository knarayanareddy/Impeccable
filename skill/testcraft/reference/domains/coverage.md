# Domain: Coverage

Coverage is a map, not a destination. Chasing the number produces tested-but-unverified code;
using the map produces confidence in the places that matter.

## What coverage tells you (and what it doesn't)

- It tells you **what executed** during the suite — nothing about what was *asserted*. A line can
  execute inside a test with zero assertions on its outcome (`suite-floor.md` #1).
- It hides the **risk shape**: 80% overall can be 95% on the boring half and 30% on the money path.
- It says nothing about **behavioral coverage**: boundaries, error paths, forbidden states — the
  cases that matter are invisible to line coverage.

## The strategy (`cover` implements this)

1. **Map risk, not lines.** Rank areas by frequency × impact × regression history (money, auth,
   data integrity first; internal formatting last).
2. **Measure per area.** Coverage of the risk areas, not one global number. A 60%-covered auth
   module is a finding; a 60%-covered string-formatting util is fine.
3. **Close gaps by cases, not by percentage.** The gap list is cases (`domains/cases.md`), each
   closing a named behavior hole — never "add tests until the needle moves".
4. **Guard the regression history.** Every production bug's area gets the bug-pinning test in the
   fix — the cheapest, highest-value coverage that exists.
5. **The floor is a policy, not a game.** A stated floor per risk tier (e.g., 90% on Tier-1), and
   coverage that's *reviewed* in PRs — deletions of meaningful tests get a comment, not a shrug.

## The gold standard: mutation testing

Mutate the code (flip a condition, change a constant); the suite should go red. Mutation score
measures assertion quality — the thing line coverage can't. Run it on the risk areas periodically;
each surviving mutant is a missing case, listed for `harden`.

## Coverage theater to ban

- `istanbul ignore` without a written reason · tests written to execute lines, not pin outcomes ·
  the coverage gate as the only quality signal · 100%-or-death on code that can't fail ·
  coverage metrics that never change a single decision.

## Bans (recap)

Number-chasing, area-blind global percentages, execute-without-assert coverage, suppress-without-
reason, coverage as the only gate.
