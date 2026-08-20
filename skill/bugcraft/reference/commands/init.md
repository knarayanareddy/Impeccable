# Command: init

Capture the debugging context and policy so every later command reads the same facts. One-time
setup per project.

## Steps

1. Inspect, don't interrogate. Read the logging setup, the error-reporting integration
   (Sentry-style), the test tooling, the CI artifacts, and the deploy log configuration. Extract
   the facts.
2. Ask the user only what the code can't answer:
   - The error-reporting path: where do production errors land, and who sees them?
   - The repro environment: how does one run the service locally with production-shaped data?
   - The debugging tooling: debuggers, profilers, trace access — and who has access.
   - The bug-tracker and the postmortem culture: where do bugs live, and do postmortems exist?
   - Known fragile zones: the components the team considers haunted.
3. Write `DEBUG.md` at the project root (or `.bugcraft/DEBUG.md` if the root is crowded):
   - How to run, how to repro (the one-command repro path per environment)
   - Error reporting, logging, and trace access
   - Tooling: debugger/profiler setup, test commands
   - The bug-tracker conventions and postmortem location
   - The known fragile zones and their history
4. End with the recommended next step: usually `audit` if the debugging posture looks sloppy,
   `shape` for a live bug, `pin` if recent fixes shipped without regression tests.

## Rules

- Facts only — DEBUG.md is shared memory, not an essay. Keep it <80 lines.
- Never ask what the code or dashboards already answer; never re-ask across sessions.
- No code edits during init. This command captures context.
