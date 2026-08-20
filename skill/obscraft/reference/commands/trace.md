# Command: trace

Distributed tracing: spans, propagation, sampling (`domains/traces.md` is the authority). The pass
that makes "where did the time go" answerable across services.

## Steps

1. Load `reference/pillars/traces.md` — it is this command's instrument authority. Audit the
   tracing posture: are there spans? at the boundaries? does the context cross service edges?
   is there a sampling strategy?
2. Fix per the rules:
   - **Spans at the boundaries** — every outgoing call (HTTP, DB, queue) becomes a child span
     with attributes (subject, outcome, sizes) (`anti-patterns.md` T2).
   - **Propagation** — the trace/correlation ID rides every hop: headers, message attributes,
     the DB comment (`anti-patterns.md` T1).
   - **Sampling strategy** — written and applied: errors and >P99 always kept, the happy path
     sampled; the decision is knowable (`traces.md`).
   - **Link to logs** — trace IDs land in the log lines (`correlate` finishes this; trace
     installs the ID into the logger context).
3. Verify: one synthetic request produces one connected trace through every service; the failing
   requests are in the sample; the dashboard's exemplar links to the trace.

## Exit criteria

- Every boundary spanned; the ID propagates end-to-end; the sampling strategy documented and
  applied; the synthetic end-to-end trace renders connected.

## Rules

- Trace fixes the spans, not the tracing infrastructure (`monitor`'s scope).
- Instrument the boundaries, not the internals — pure logic doesn't need spans
  (`domains/traces.md`).
- A trace that stops at a service edge is a lie with a flame graph — propagation is
  non-negotiable.
