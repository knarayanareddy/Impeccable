# Domain: Environments

Environments are where "works on my machine" goes to die. The craft: one described state per
environment, promotion by promotion, drift detected by machines — never by memory.

## The environment contract

Each environment (dev / stage / prod) states:
- **What it is for** — dev for development, stage for rehearsal, prod for users. The environments
  have different *jobs*, and the differences between them are enumerated, not accidental.
- **Its source of truth** — the IaC + config that describes it, versioned in the repo.
- **Its parity contract** — how close it must be to prod (stage = prod's twin; dev may lag), and
  which differences are *allowed* (data, scale, secrets) vs *forbidden* (versions, topology,
  behavior).
- **Its promotion path** — how a change travels dev → stage → prod, and what must be true at
  each step.

## The parity rules

- **Same versions everywhere** — runtime, dependencies (via lockfiles), image tags. A stage
  running an older runtime is a rehearsal of the wrong play.
- **Same config shape** — one template, per-environment deltas (URLs, secrets, scale) as small,
  generated, diffable deltas (`anti-patterns.md` E3) — never three hand-copied full configs.
- **Same topology** — stage mirrors prod's shape (services, DB, queues) at smaller scale. The
  staging twin is the point of the environment.
- **Secrets are per-environment and scoped** (`domains/config.md`) — dev credentials never unlock
  prod (`anti-patterns.md` E4).

## Drift detection (`env` implements this)

- **Detect, don't remember** (`ship-floor.md` Reflexes): a scheduled or CI job reconciles the
  described state against reality (IaC plan/apply -detailed-exitcode, config diffs, version
  probes) and pages on drift. If the answer to "does prod match the repo?" is "I think so", the
  answer is no.
- **Snowflake servers are bugs** (`anti-patterns.md` E2): hand-tweaked machines get captured into
  IaC or rebuilt from it — the manual fix dies with the person who applied it.

## Promotion discipline

- A change promotes only when the previous environment proved it: green gates in stage before
  prod (`domains/gates.md`).
- Promotion is a decision recorded in the deploy log — not a script someone "just ran".
- Rollback per environment (`domains/recovery.md`): stage's rollback is prod's rehearsal.

## Bans (recap)

Hand-built environments, copied configs, missing parity contracts, drift-by-memory, snowflake
servers, shared secrets across environments.
