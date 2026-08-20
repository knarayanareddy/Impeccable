# DEBUG.md — example shape

The canonical debugging-context file written by `init`. Copy this shape; keep it tight.

```markdown
# Run & repro
local: <one command> · prod-shaped data: <seed script> · repro path per env: <how>

# Evidence plumbing
error reporting: <Sentry-style, project + org> · logs: <store + query path>
traces: <vendor> with error over-sampling · correlation: request_id in logs + traces

# Tooling
debugger: <launch config> · profiler: <command> · time-travel: <rr/ttd if available>
tests: <unit/integration commands>

# Bug tracking & postmortems
tracker: <board, label convention> · postmortems: <docs location, blameless format>
pin convention: every fix ships a regression test linking the bug id

# Known fragile zones
<the haunted components, with their history and who knows them>
```
