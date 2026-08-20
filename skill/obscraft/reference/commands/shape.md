# Command: shape

Design the telemetry before building: the questions the feature must answer, mapped to signals
(`domains/telemetry.md` is the authority). Observability shaped early is a feature; bolted on, it's
a log-everything accident.

## Steps

1. Restate the feature as a journey: what does the user do, and what must a human know to operate
   it? ("A buyer completes checkout; operators need to know: is it completing, how fast, and where
   does it break?")
2. List the questions, ranked by how they'd matter at 3 a.m.:
   - Health: is the journey working, how fast (SLO-shaped)?
   - Attribution: if it breaks, where — which dependency, which step?
   - Story: for a specific failure, what happened in order?
3. Map each question to the cheapest pillar (`telemetry.md`): health → metrics (latency
   histogram, error rate, saturation); attribution → traces (spans at every boundary);
   story → logs (the warn+ events with correlation IDs).
4. Define the concrete signals: metric names in the vocabulary, span boundaries, the log events
   and their fields (`logs.md`'s contract), the correlation-ID path through every hop.
5. Define the SLO for the journey if it's critical (`slos.md`): SLI + target + window + owner.
6. Deliver: questions → signals table, the SLO draft, and the acceptance test (the 3 a.m. walk:
   page → dashboard → trace → log, end to end).

## Rules

- Shape never edits code. It ends where `instrument` begins.
- Every signal names its question and owner; a signal that answers nothing is cut here, not
  shipped.
- The SLO is part of the shape — observability without an objective is instrumentation, not
  observation.
