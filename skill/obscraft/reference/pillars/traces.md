# Pillar sheet: Traces

Loaded with `domains/traces.md` when the work is tracing. The domain says *what* a trace must
be; this sheet says *how* to get there in a real codebase.

## The instruments

| Question | Instrument |
|---|---|
| Do spans cross every boundary? | The trace view on one synthetic request — dead-end spans are the gap list |
| Does the context propagate? | `traceparent`/W3C headers on every outgoing call (`traces.md`'s propagation rule) |
| Are the interesting traces kept? | The sampling strategy in the exporter config — errors + >P99 always kept |
| Do traces link to logs? | Trace ids in the log context (the pillars are one system) |

## The workflow

1. **Span the boundaries, not the internals**: HTTP clients, DB calls, queue publishes —
   pure logic needs no spans (`traces.md`'s span rule).
2. **Attributes name the story**: subject, outcome, sizes on each span — the "why was this
   one slow?" answer without reopening the payload.
3. **Propagate through every hop**: the incoming context rides every outgoing call —
   the trace that stops at the service edge lies about the outage
   (`anti-patterns.md` T1, the checker flags the handler file).
4. **Write the sampling strategy down**: what's always kept, what's sampled, and how the
   answer to "is my request in the sample?" is knowable (`traces.md`'s sampling rule).

## The bans to enforce

Dead-end spans · un-propagated calls (`no-correlation-propagation`) · strategy-less
sampling · spans without attributes · traces that don't join the logs.

## Bans

Boundary-less instrumentation · dropped context · all-or-nothing sampling · attribute-less
spans · unlinked pillars.
