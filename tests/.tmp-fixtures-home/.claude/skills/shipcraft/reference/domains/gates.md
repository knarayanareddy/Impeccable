# Domain: Gates

Gates are where the pipeline tells the truth: the checks that must hold before the change moves
forward. The rule is absolute: **the gate blocks; the log explains.** A gate that notifies and
passes is a lie with a webhook (`ship-floor.md` #2).

## What belongs in CI (the gate stack)

| Stage | The gate |
|---|---|
| On push | Lint, format, types — seconds, must pass |
| On branch | **Branch protection itself is a gate**: PRs required, CI green required, approvals per policy, force-push disabled — the platform-level baseline under everything else |
| On PR | Unit tests, coverage policy, dependency audit, secret scan — must pass |
| Pre-merge | Integration tests, build, security scan — must pass |
| Pre-deploy | The artifact checks, env parity check, deploy approval (if the policy says) |
| Post-deploy | Smoke tests, health verification, the rollback trigger armed |

## The gate rules

- **Fail the build.** A violated gate stops the change — red, with the log explaining what failed
  and the fix. "Warning mode" is for things that will become gates; it has an expiry date or it
  is noise.
- **Fast gates first** (`domains/pipelines.md`): the cheapest signal runs earliest — the
  engineer's feedback loop is the gate's latency.
- **Deterministic gates** — the same input gives the same verdict. A gate that flakes is a
  gate nobody believes (`autom` fixes it; `testcraft`'s determinism domain is the authority).
- **Gates are code** — defined in the repo, versioned, reviewed. A gate hand-configured in the
  CI UI is an unowned gate.

## The approval gate (the human one)

- Manual approval for production deploys is a *policy choice*, not a security control — the
  reviewer approves the change, the gates approve the quality. Both, not either.
- Approvals are recorded in the deploy log (`monitor`) — who approved what, when.
- Approval requirements scale with risk: routine deploys may auto-ship behind gates; schema
  changes and destructive ops require a human (`anti-patterns.md` I2).

## Flaky-gate hygiene (`autom` is the fix)

- A gate that fails intermittently is broken — root-caused, not retried (`ship-floor.md` #3).
  Every retry costs the team's belief in red.
- Gate results are monitored: gate pass rate, gate duration, the slowest gates — the gate stack
  has its own SLO (`monitor`).

## Bans (recap)

Notify-and-pass gates, warning-mode-forever, flaky gates with retries, unowned UI-configured
gates, approval theater without gates, gates that don't explain their red.
