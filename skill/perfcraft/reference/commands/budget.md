# Command: budget

Performance budgets as code, enforced by CI — the regression gate that makes performance a
feature instead of a memory (`perf-floor.md` #6). The single highest-leverage perf change a team
can make: gates don't optimize anything, they prevent everything.

## Steps

1. Inventory the tracked interactions from PERF.md (or define them with the product): the
   revenue/retention-critical paths and surfaces.
2. Define a budget per interaction, with its percentile and environment:
   - Web: LCP / INP / CLS thresholds, p75, measured by Lighthouse-CI (lab) and RUM (real).
   - Backend: P95 latency per hot path, from traces/load tests.
   - Delivery: bundle/asset size budgets (per route, per class), gated at build.
3. Encode the budgets in the repo: budget files (lighthouse budgets, bundle budgets, custom
   scripts) wired into CI so a regression **fails the build** — notifies are not gates.
4. Wire the escalation: which budgets are hard gates (block merge) vs warnings (non-blocking,
   reviewed) — and who owns each.
5. Verify the gate works: introduce a deliberate regression (in a branch), watch it fail, revert.
   An untested gate is a decoration.

## Rules

- Every budget names its percentile and environment — a budget without a percentile is a wish
  (`shape` agrees).
- Budgets are product decisions: negotiate them with the product owner, don't invent them from
  benchmarks.
- Set budgets *below* the current pain point with a plan to meet them — a gate set at today's bad
  number blesses the status quo.

## Exit criteria

- Budgets encoded, CI-gated, escalation assigned, the gate proven by a deliberate regression,
  PERF.md updated with the wiring.
