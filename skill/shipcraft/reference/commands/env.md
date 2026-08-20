# Command: env

Environment parity: kill the drift (`domains/environments.md` is the authority). The pass that
makes "works on my machine" extinct and stage a real rehearsal.

## Steps

1. Inventory the environments and their current state: versions (runtime, deps), config shapes,
   topology — and the parity contract from SHIP.md (or the gap where one should be).
2. Diff reality against the described state (`domains/infra.md`): IaC plan/diff, config
   comparison, version probes. Every difference is a finding with a source (a hand fix, a
   console change, a lagging pipeline).
3. Fix the drift:
   - **Capture or rebuild** — a hand-tweaked server becomes IaC, or gets rebuilt from it
     (`anti-patterns.md` E2); the manual fix dies with its author.
   - **Converge config** — one template with per-environment deltas, generated and diffable
     (`anti-patterns.md` E3).
   - **Align versions** — same runtime and lockfile-backed dependencies across stage and prod;
     the parity contract says which differences are allowed (data, scale, secrets) and which
     are forbidden.
4. Wire the detection (`domains/infra.md`): a scheduled or CI drift check that pages on
   divergence. Drift found by machines, never by memory (`ship-floor.md` Reflexes).
5. Verify: the drift check runs clean; stage rebuilds from the repo alone (the reproducibility
   proof); the parity contract written in SHIP.md.

## Exit criteria

- Drift findings resolved (captured or rebuilt); config converged to one template; detection
  wired and clean; the parity contract recorded.

## Rules

- Env fixes the environments, not the pipeline or deploys (`pipeline`/`deploy`'s scope).
- A parity fix that makes stage *less* useful (stripping it of needed differences) is wrong —
  the contract names the allowed differences, and they stay.
- Repeated drift from the same source gets the source fixed — the person gets the pipeline, not
  the lecture.
