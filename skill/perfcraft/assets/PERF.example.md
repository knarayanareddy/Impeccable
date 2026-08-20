# PERF.md — example shape

The canonical performance-context file written by `init`. Copy this shape; keep it tight.

```markdown
# Targets (per tracked interaction, percentile stated)
checkout: P95 < 480ms (backend, production trace) · dashboard LCP < 2.5s p75 (RUM)
search: INP < 200ms p75 (mobile class) · bundle: JS <= 200KB / route

# Hot paths (must stay budgeted)
1. POST /checkout — the money path; budget slices: DB 150ms, payment API 250ms
2. GET /feed — paginated 20, cursor keyset
3. dashboard render — main thread budget

# Tooling
profiler: <py-spy / pprof / chrome tracing> · traces: <OTel collector> · RUM: <provider>
load test: <k6 script> (knee identified at 1,400 rps)

# Gate wiring
budget files: budgets/lighthouse.json (CI fails on regression) · bundle: bundlesize CI

# Known bottlenecks & baselines
<current measured baselines per hot path, with date and method>
```
