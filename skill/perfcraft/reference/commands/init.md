# Command: init

Capture the performance context and policy so every later command reads the same facts. One-time
setup per project.

## Steps

1. Inspect, don't interrogate. Read the build config, the CI workflow's perf steps, any budget
   files, the frontend framework setup, and the request paths in the code. Extract the facts.
2. Ask the user only what the code can't answer:
   - The performance targets: LCP/INP/CLS budgets, P95 latency targets per service, bundle budgets.
   - The risk areas: which interactions are revenue/retention-critical (the budgeted ones)?
   - Tooling: profilers in use, APM/tracing, RUM, load-test harness.
   - The gate policy: which budgets block CI, and who owns perf regressions.
3. Write `PERF.md` at the project root (or `.perfcraft/PERF.md` if the root is crowded):
   - Targets per tracked interaction (with the percentile and the environment they're measured in)
   - The hot paths: the 5–10 requests/interactions that must stay budgeted
   - Tooling: profilers, tracing, RUM, load-test setup (and how to run each)
   - The gate wiring: where budgets live and what fails CI
   - Known bottlenecks and the current measured baselines
4. End with the recommended next step: usually `measure` for baselines, `profile` for a known slow
   path, `budget` if the gates are missing.

## Rules

- Facts only — PERF.md is shared memory, not an essay. Keep it <80 lines.
- Never ask what the config or dashboards already answer; never re-ask across sessions.
- No code edits during init. This command captures context.
