# Domain: Pipelines

The pipeline is the product — its users are the team, its latency is minutes, and its failure mode
is a blocked or lying pipeline. This is the differentiator domain: everything else in this skill is
machinery for making the pipeline *true* and *boring*.

## The pipeline's contract

Every pipeline states, implicitly or explicitly:
1. **What it promises** — a green build means: code builds, tests pass, gates hold, the artifact
   is deployable. If green means less than that, the promise is wrong or the pipeline is.
2. **What it costs** — minutes per run, dollars per month, attention per failure. All three are
   budgeted (`measure`), not discovered.
3. **What it blocks on** — the gates that must hold before merge, before deploy, before release
   (`domains/gates.md`).

## Stage design (the boring shape)

```
validate (fast: lint, types) → test (unit → integration) → build (one artifact)
   → package (image, pinned) → scan (security, secrets) → deploy (staged) → verify (smoke, health)
```

- **Fast stages first, expensive later** — the cheapest feedback earliest; a lint failure should
  cost 30 seconds, not a full test suite.
- **The artifact is built once** and promoted unchanged through the later stages
  (`domains/builds.md`).
- **Each stage has one job** — a stage that does three things fails for three reasons.

## Speed and safety (the trade, honestly)

- **Parallelize what's independent** (test shards by module, matrix builds), serialize what isn't.
- **Cache deliberately** — dependency caches with content-addressed keys; a cache that serves
  stale truth is a flake generator.
- **The pipeline's own SLO**: a stated target for pipeline minutes and flake rate — measured,
  gated, and owned (`monitor`). A pipeline nobody measures rots.

## The truth rules

- **Green means shippable.** If the team habitually ships with red steps, the pipeline and the
  team disagree — fix the steps or fix the team's definition of done; never learn to ignore the
  color.
- **Red is information** (`ship-floor.md` #4): the change is broken or the pipeline is. Fixing
  the pipeline (a flaky step, a wrong gate) is legitimate; masking red is never.
- **The pipeline is code** — in the repo, reviewed in PRs, deploy-path changes get extra scrutiny
  (`ship-floor.md` #10).

## Bans (recap)

Red masks, gates that notify, flaky-retry culture, curl|sh, manual-only steps, stage soup, caches
that lie, pipelines nobody measures.
