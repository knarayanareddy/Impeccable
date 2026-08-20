# Command: init

Capture the test conventions, stack, and policy so every later command reads the same facts.
One-time setup per project.

## Steps

1. Inspect, don't interrogate. Read the test configuration (framework, runners, scripts), the CI
   workflow's test steps, the test directory layout, and a few representative test files per level.
   Extract the facts.
2. Ask the user only what the code can't answer:
   - The risk tiers: which areas are Tier-1 (money, auth, data integrity) vs Tier-3 (formatting)?
   - The pyramid policy: unit/integration/E2E budgets, suite duration targets.
   - Coverage policy per tier (floor percentages, mutation-testing cadence).
   - Flakiness policy: how flakes are tracked, quarantined, and who owns them.
3. Write `TESTS.md` at the project root (or `.testcraft/TESTS.md` if the root is crowded):
   - Frameworks and commands (unit, integration, E2E, coverage)
   - Directory conventions and file naming
   - The pyramid policy: what lives at each level, duration budgets
   - Coverage policy per risk tier + the risk-tier list
   - CI wiring: when each level runs (per-PR smoke vs nightly full)
   - Known flaky history and quarantine rules
4. End with the recommended next step: usually `review` for an unfamiliar suite, `audit` if it
   already looks sloppy, `shape` for new work.

## Rules

- Facts only — TESTS.md is shared memory, not an essay. Keep it <80 lines.
- Never ask what the config or CI already answers; never re-ask across sessions.
- No test edits during init. This command captures context.
