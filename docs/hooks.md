# Wiring the checkers as harness automation hooks

Every skill ships a deterministic checker (`skill/<name>/scripts/check.mjs`) that Setup tells the
agent to run after edits. For belt-and-braces, wire it as an automation hook so it runs even when
the agent forgets.

## Claude Code (PostToolUse hook)

Add to the project's `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PLUGIN_ROOT/skills/<skill>/scripts/check.mjs\" --strict --target <path> || true"
          }
        ]
      }
    ]
  }
}
```

The `|| true` here is deliberate: the hook *surfaces* findings; the agent's verification loop
*fixes* them (the floor rule "red is never masked" applies to CI gates, not to advisory hooks).

## Cursor / Codex / other harnesses

Same principle: a file-save or tool-result hook that runs
`node <skill-dir>/scripts/check.mjs --strict` on the changed path and appends the output to the
agent's context. Exit code 0 = clean; 1 = findings (errors fail `--strict`); 2 = usage error.

## CI gates (strongest form)

For suites with real teams, the strongest wiring is CI: run each checker with `--strict` on the
changed files and fail the build. That converts craft from advice into a gate — see each skill's
floor file ("gates block" doctrine in shipcraft, budget gates in perfcraft, etc.).
