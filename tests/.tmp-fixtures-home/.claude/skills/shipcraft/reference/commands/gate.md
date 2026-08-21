# Command: gate

Quality gates that block, not notify (`domains/gates.md` is the authority). The pass that makes
the pipeline's green mean something again — and kills the lies with webhooks.

## Steps

1. Inventory the current gates: which checks run where, which block vs warn, which get ignored,
   and the flaky-gate history.
2. Fix per the rules:
   - **Block, don't notify** — every gate that represents a real standard fails the build on
     violation; the log explains the red and the fix (`domains/gates.md`).
   - **Warning mode has an expiry** — a check too noisy to block becomes a gate on a schedule,
     or it becomes noise; "warning forever" is banned.
   - **Fast gates first** — reorder so the cheapest signal runs earliest (`domains/pipelines.md`).
   - **Deterministic gates** — a gate that flakes is root-caused (`autom`), not retried.
   - **Gates as code** — defined in the repo, versioned, reviewed; UI-configured gates are
     unowned gates.
3. Wire the approval gate where policy demands (prod deploys, destructive ops) — recorded in
   the deploy log (`domains/gates.md`).
4. Verify: a deliberately-bad change fails the right gate with an explanatory log; a good change
   passes clean; gate pass rate and duration recorded (`monitor`). The gate in tool form is
   `node <skill-dir>/scripts/ci-check.mjs --pipeline <file> --strict` (`reference/commands/ci-check.md`)
   — wire it into the pipeline so the gates gate themselves.

## Exit criteria

- Every gate blocks with an explanatory red; warning-mode expiries set; the gate stack ordered
  fast-first; gates versioned in the repo; the deliberate-bad-change test passes.

## Rules

- Gate fixes the checks; it doesn't rewrite the pipeline (`pipeline`'s scope).
- The gate's job is truth: a gate the team ignores is worse than no gate — fix the gate or
  delete it, never leave it shouting into the void.
- Approval is not a substitute for gates — the reviewer approves the change, the gates approve
  the quality (`domains/gates.md`).
