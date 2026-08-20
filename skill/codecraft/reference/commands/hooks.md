# Command: hooks

Manage the checker's harness hook — the code-facet equivalent of the reference skill's hook
manager. The hook runs `check.mjs` automatically after code edits so findings surface even when
the agent forgets the verification step.

## Usage

```bash
node <skill-dir>/scripts/hooks.mjs status          # wired or not? (exit 0/1)
node <skill-dir>/scripts/hooks.mjs on              # dry run: print the settings merge
node <skill-dir>/scripts/hooks.mjs on --apply      # wire the PostToolUse hook
node <skill-dir>/scripts/hooks.mjs off --apply     # remove it
```

## The doctrine

- The hook **surfaces** findings (`|| true` deliberately — it never blocks the agent); the
  agent's verification loop **fixes** them; CI gates are the blocking form (`--strict` in CI
  fails the build). Same doctrine as the repo's `docs/hooks.md`.
- The hook targets `Edit|Write` events and runs `check.mjs --strict` on the changed path —
  findings land in the agent's context, not in a hidden log.
- `status` is the audit tool: a project where the hook was once wired and later removed is a
  finding about process, not just config.
