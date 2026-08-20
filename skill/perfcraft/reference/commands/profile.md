# Command: profile

Measure where time actually goes — the signature command of this skill. Profiling turns "it feels
slow" into an attribution list with the fix sitting at the top of it. No code edits (the fixes
belong to `optimize`).

## Steps

1. Pick the instrument for the question (`domains/measurement.md`). If the surface is the
   browser, backend services, or the data layer, the matching `reference/measurement/` sheet is
   the instrument authority — one sheet, never all.
   - CPU-bound? → CPU profiler / flame graph.
   - Latency across services? → distributed trace.
   - Allocation/GC problems? → heap profiler / allocation trace.
   - User experience? → browser DevTools / Lighthouse / RUM.
2. Capture under real conditions: production-shaped data and load, the real device classes, the
   real environment. A profile of the dev laptop with 10 rows is a profile of the dev laptop.
3. Read the attribution:
   - **CPU:** the top frames by self-time — each is a candidate fix.
   - **Trace:** per-hop durations — queue time vs compute vs I/O wait (`domains/latency.md`).
   - **Browser:** long tasks, render-blocking, LCP element chain (`domains/web.md`).
4. Deliver the attribution report: the top consumers (with numbers), the bottleneck's *cause*
   (not just its location), and the ranked candidate fixes with predicted gain — one hypothesis
   per fix, to be tested by `optimize`.
5. Record the baseline in PERF.md — this profile is the "before" that every later fix quotes
   against.

## Rules

- Profile before concluding. "It's probably the database" is a hypothesis to verify with the
  trace, not a finding.
- The tail gets its own profile: sample the P99 requests specifically — the tail's causes differ
  from the median's (`domains/latency.md`).
- A profile without numbers in the report is a vibe. Cite self-times, hop durations, and task
  lengths.

## Exit criteria

- Attribution with numbers delivered; the bottleneck cause named; the candidate fixes ranked by
  predicted gain; the baseline recorded for the before/after.
