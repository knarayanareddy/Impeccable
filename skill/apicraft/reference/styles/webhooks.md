# Style sheet: Webhooks

Loaded with `domains/idempotency.md` when the surface is webhooks (outbound events or inbound
consumption). The style-native specifics; the compass domains still hold.

## The event contract

- Every delivery carries: a stable `event_id` (the dedupe key), `event_type` (a documented
  vocabulary — additive-only, never renamed), `occurred_at` (RFC 3339, explicit zone), and the
  payload schema version.
- Payload schemas are versioned and additive: new optional fields are free; renames and
  removals follow `versioning.md`'s deprecation protocol — consumers run on their own clock, so
  the window is longer than for request/response APIs.

## Delivery semantics (the honest promise)

- At-least-once delivery with retry is the promise; consumers MUST dedupe on `event_id`
  (`domains/idempotency.md` — the event id is how). Exactly-once is a myth; document the
  delivery guarantee explicitly, per event type.
- Retry with exponential backoff + jitter on non-2xx; dead-letter after the policy's max
  attempts with an observable queue (`obscraft`'s alerts domain: dead-letter depth is an SLO
  input, not a log line).

## Security (webhooks are internet-facing writes)

- Sign every delivery: HMAC-SHA256 over the raw body with a per-consumer secret, signature in
  a header, and a timestamp with a replay window (`domains/idempotency.md`'s signature section
  is the authority). Consumers verify before trusting.
- Inbound webhooks (your API receiving) get the same treatment: verify the sender's signature,
  reject outside the replay window, then process — an unsigned webhook is an open write
  endpoint (`seccraft`'s abuse domain agrees).
- Secrets are per-consumer, rotatable, and never logged (`seccraft`'s secrets domain).

## Ordering and batching

- No ordering guarantee unless the contract states it — and if it states it, the
  implementation enforces it (partitioning per aggregate). A stated order that the retry path
  violates is the classic webhook lie.
- Batch deliveries where volume demands, with per-event results (one failed event doesn't
  hide the others' success — `domains/payloads.md`'s batch rule).

## Bans

Unversioned payloads, missing event ids, unsigned deliveries, unstated delivery guarantees,
order promises the retry path breaks, consumers parsing the signature header's internals.
