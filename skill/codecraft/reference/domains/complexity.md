# Domain: Complexity

Complexity is the reader's tax. It is justified only when it pays rent: correctness, measured
performance, or domain modeling. The job of craft is to keep the tax as low as the contract allows.

## The metrics that matter

- **Function length** — the single strongest predictor of defect density. Ceiling ~30 lines
  (`quality-floor.md` #2).
- **Nesting depth** — every level multiplies the reader's mental state. Ceiling 3–4 (#3).
- **Parameters** — 4+ means a hidden concept (#4).
- **Cyclomatic complexity** — branches per function; >10 is a smell, >20 is a review blocker unless
  the domain itself branches (parsers, dispatchers).
- **Cognitive complexity** (SonarSource's metric, the industry standard) — weights nesting and
  control-flow breaks over raw lines: a function can be short and cognitively dense. Use it in
  `measure` alongside length; treat a per-function score > 15 as the review threshold where the
  linter supports it.
- **Duplication** — the same decision made twice (`domains/duplication.md`).
- **Change coupling** — files that always change together are one module wearing two names
  (`domains/structure.md`).

## How complexity sneaks in

1. **Accretion** — the function that "just grew a little" for six releases. The fix is extraction and
   the ceiling.
2. **State sprawl** — a boolean that gets set in three places and read in five. Replace with
   derivable state (compute, don't cache) or a named state machine.
3. **Mixed abstraction levels** — business rules interleaved with plumbing (`domains/functions.md`).
4. **Speculative generality** — the factory for the one impl, the interface for the one consumer
   (`abstract`).
5. **Copied logic with local tweaks** — the worst of both duplication and branching.

## Reducing complexity (in order)

1. **Extract** the detour into a named function — the name pays for the indirection.
2. **Flatten** with guards and early returns — remove the level entirely.
3. **Replace state with derivation** — compute from the inputs, or model as a finite state.
4. **Introduce the right type** — a union/enum/struct that makes illegal states unrepresentable
   (the highest-leverage simplification that exists).
5. **Delete** — the best complexity is the complexity that isn't there.

## When complexity is right

Complexity pays rent when: the domain itself branches (protocols, parsers, pricing rules), the
performance was measured and the simple version failed the number, or the abstraction removes *more*
complexity from call sites than it adds. In all three cases, write the justification — the next reader
deserves the receipt.

## Bans (recap)

Complexity without a receipt, boolean-flag state sprawl, speculative generality, mixed abstraction
levels, clever code that needs a comment to be read.
