# Command: prune

Pipeline debt: dead jobs, slow steps, orphaned environments, and flag debt (`domains/pipelines.md`
is the authority). The only delivery improvement that removes complexity — everything else adds
machinery.

## The prune list

1. **Dead jobs** — workflow steps and jobs that run but gate nothing, notify nobody, and serve
   no question (`measure` finds them).
2. **Slow steps** — the top duration consumers that aren't paying their minutes (`measure`'s
   slowest-5 list is the hit list; `speedup`-style thinking from testcraft applies).
3. **Orphaned environments** — stage branches, preview environments, and snowflake boxes nobody
   uses: destroyed or captured, never left drifting (`env`).
4. **Flag debt** — feature flags that shipped and stayed: owner + expiry per flag; expired flags
   removed from code and config (`domains/deploys.md`).
5. **Mask debt** — leftover `|| true`/`continue-on-error` masks with stale "temporary" reasons:
   the step gets fixed or deleted, the mask never lives forever (`anti-patterns.md` H1).
6. **Cache bloat** — caches keyed wrongly or holding dead dependencies: the stale-truth flake
   generator (`domains/builds.md`).

## Steps

1. Build the candidate list from `measure`/`audit` output with evidence per candidate (duration,
   run count, last usage, gate status).
2. Get one confirmation on the list before deleting — pruning ships as a removal PR the team
   reviews as such.
3. Delete in one batch; re-measure: pipeline minutes, job count, environment count. Quote the
   deltas.
4. Record in SHIP.md what was pruned and why — the memory prevents the regrowth.

## Rules

- Prune by evidence, not instinct — a "probably dead" job gets usage-checked before it's cut.
- Never prune the gate that's blocking (`gate`'s truth is sacred): the list is dead weight, and
  dead weight blocks nothing.
- One batch, one PR, reviewable as removals — pruning smuggled into feature work is how outages
  hide.

## Exit criteria

- Candidates resolved (removed or defended with a reason); before/after pipeline minutes and
  counts quoted; SHIP.md updated.
