# Domain: Traces

Traces answer "where did this request's time go?" — the attribution story across services. The
craft: spans at the boundaries, propagation through every hop, and a sampling strategy written
down.

## What a good trace looks like

- **One root span per request**, with the journey named (`checkout.complete`), and child spans for
  every meaningful step: auth, DB calls, dependency calls, serialization (`anti-patterns.md` T2).
- **Spans at the boundaries** — the HTTP client call, the DB query, the queue publish. The
  expensive operations are the spans; the pure logic between them needs none.
- **Attributes on spans**: the subject (order_id), the outcome (status code), sizes — enough to
  answer "why was this one slow?" without reopening the payload.
- **Span events for the story**: the retry happened, the cache missed, the fallback engaged.

## Propagation (the boundary discipline)

- **One correlation/trace ID per request, through every hop** (`signal-floor.md` #5):
  `traceparent`/W3C headers on HTTP, message attributes on queues, fields on the DB comment.
- Every outgoing call inherits the incoming context — the trace that stops at the service edge
  lies about the outage (`anti-patterns.md` T1).
- The ID lands in the log lines too (`logs.md`'s contract) — traces and logs become one story
  (`correlate`).

## Sampling strategy (written, not defaulted)

- **Head sampling** (decide at the root): simple, but misses the interesting tail.
- **Tail/error sampling** (decide after completion): keeps every error and every slow request —
  the traces you actually need in an incident. The modern default where the platform allows.
- The strategy is a written decision: what's always kept (errors, >P99), what's sampled (the happy
  path), and how the answer to "is my request in the sample?" is knowable
  (`signal-floor.md` Reflexes).

## Using traces

- **Exemplars**: one representative slow trace per bucket, attached to the dashboard's latency
  panel — the number links to its story (`dashboard`).
- **The incident path**: alert → dashboard → exemplar trace → span → log line with the same ID.
  If any hop is missing, that hop is the work (`correlate`).
- **Attribution, not blame**: the trace shows queue time vs compute vs dependency — the SLO burn's
  root cause, one span at a time (`perfcraft`'s measurement domain agrees).

## Bans (recap)

Dead-end spans, no propagation, no sampling strategy, spans without attributes, traces that don't
link to logs.
