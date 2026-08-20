# Command: measure

The quantitative pass. Numbers, not adjectives. Complements `review` (judgment) and `audit` (defects).
No code edits.

## What gets measured

1. **Function size** — length distribution of functions in the target: min / median / max / count
   over the ceiling. (Approximate by parser or by inspection for small targets; state the method.)
2. **Nesting depth** — max and distribution of control-flow depth per function.
3. **Parameters** — max per function; count of functions with 4+; count of boolean flag parameters.
4. **Duplication** — repeated blocks ≥ 6 lines found by inspection or a duplication tool; report
   count and locations.
5. **Naming** — names failing the `naming.md` tests (vagueness in signatures, names that lie after
   recent edits, inconsistent concepts).
6. **Comments** — ratio of what-comments to why-comments; commented-out blocks (checker counts
   these); TODO/FIXME count per file.
7. **Errors** — swallowed catches (checker), contextless rethrows, magic-value failures.
8. **Suppressions** — count and explained-rate (explained / total).
9. **Drift** — files changed together in recent history that share no module boundary
   (change coupling, if git history is available).
10. **Floor clearance** — the target's numbers against `quality-floor.md`, one line each.

## Output

A measurement report: table of metrics with numbers, the floor comparison, then the ranked delta
list — cheapest change to highest impact.

## Rules

- Every number cites its method (parsed / inspected / checker). If a metric can't be measured with
  available tooling, report "not measured" — never guess.
- Measure before and after any refactor pass, and quote both — that's how craft becomes visible.
