# Command: correlate

Link the pillars: correlation IDs, exemplars, one vocabulary (`domains/telemetry.md` is the
authority). The pass that turns three rumors into one story — the incident path only works when
every hop links.

## Steps

1. Walk the incident path and find the breaks: alert → dashboard (does the panel link the
   journey?) → exemplar trace (does the latency panel carry one?) → span (does it name the
   dependency?) → log line (does it share the trace ID?). Every missing hop is the work.
2. Fix per hop:
   - **Correlation ID in logs** — the logger context carries the trace ID (`logs.md`'s
     contract).
   - **Exemplars on dashboards** — one representative trace per bucket on latency panels
     (`traces.md`).
   - **Trace-to-log links** — the span's attributes include the log anchor; the log line
     includes the span ID.
   - **One vocabulary across pillars** — the journey name is the same in the metric, the span
     name, the log operation, and the dashboard row (`telemetry.md`).
3. Verify the full chain on a synthetic failure: alert → panel → exemplar → span → log line, no
   dead ends.

## Exit criteria

- The incident path links end-to-end; the vocabulary is one across all three pillars; the
  synthetic walk recorded.

## Rules

- Correlate fixes the links, not the signals — the pillars themselves are `log`/`metric`/
   `trace`'s scope.
- A pillar that can't be linked (platform limits) gets its limitation *documented*, not
  ignored — an honest gap is a ticket; a silent one is a lie.
