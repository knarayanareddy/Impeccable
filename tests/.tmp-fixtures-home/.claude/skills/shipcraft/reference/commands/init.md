# Command: init

Capture the delivery context and policy so every later command reads the same facts. One-time
setup per project.

## Steps

1. Inspect, don't interrogate. Read the pipeline configs (CI/CD files), the deploy tooling, the
   IaC, the environment setup, and the release docs. Extract the facts.
2. Ask the user only what the code can't answer:
   - The environments and their parity contract (which mirrors prod, which may lag).
   - The deploy policy: strategy per risk class, approval requirements, the Friday test.
   - The rollback posture: is there a rehearsed revert path today?
   - The delivery targets: pipeline minutes budget, deploy frequency goals, flake tolerance.
   - Who owns delivery: the on-call release path and escalation.
3. Write `SHIP.md` at the project root (or `.shipcraft/SHIP.md` if the root is crowded) — start from the template `assets/SHIP.example.md`:
   - Environments: names, purposes, parity contracts, promotion path
   - Pipeline inventory: what runs where, the gate stack, the artifact flow
   - Deploy policy: strategies, approval gates, health checks, rollback triggers
   - Secrets posture: store, scoping, rotation
   - Delivery metrics: current baselines and targets (pipeline minutes, DORA)
4. End with the recommended next step: usually `audit` if the delivery already looks sloppy,
   `rollback` if there's no tested revert path, `pipeline` for new CI.

## Rules

- Facts only — SHIP.md is shared memory, not an essay. Keep it <80 lines.
- Never ask what the configs already answer; never re-ask across sessions.
- No pipeline or infra edits during init. This command captures context.
