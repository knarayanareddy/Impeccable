# Domain: Idempotency

Networks retry. Proxies retry. SDKs retry. Consumers retry. An API that can't be safely retried is
an API that will be retried anyway — with consequences. Idempotency turns "at least once" delivery
into "effectively once" behavior.

## The safety table (who may retry what)

| Method | Safe to retry | Mechanism |
|---|---|---|
| GET / HEAD | Always | Safe by definition |
| PUT | Always (full replacement) | Idempotent by definition |
| DELETE | Always (delete twice = same outcome) | 204 or 404, consistently |
| POST / PATCH | Only with an idempotency key | `Idempotency-Key` header (or equivalent) |

## Idempotency keys

- **The contract:** consumer sends `Idempotency-Key: <uuid>`; the server records the key + the
  response; a retry with the same key returns the *stored* response (same status, same body), not a
  second side effect. Different key, same body → the second attempt runs normally.
- **Storage and expiry:** keys scoped per (endpoint, caller), retained ≥ 24h (or per your policy),
  expired safely — an expired key means a normal new request, never a 409.
- **Error handling:** if the first attempt failed (5xx), the retry with the same key returns the
  stored failure — the consumer can decide. Never record a 500 as the "result" in a way that makes
  the operation unretryable by the API's own semantics.
- **Where:** every POST/PATCH that creates money, jobs, or externally-visible effects. Reads and
  search-style POSTs don't need keys.
- **Concurrent duplicates:** two requests with the same key racing → one wins, the other gets the
  same stored response (and optionally 409 with the original's id).

## Job and webhook idempotency

- **Async jobs:** `POST /jobs` with a key returns the same job id on retry; `GET /jobs/{id}` is the
  polling contract; a failed job has a stable failure state, not a mystery void.
- **Webhooks:** every delivery carries a stable `event_id` + `event_type` + timestamp; consumers
  dedupe on `event_id`. Senders retry with backoff on non-2xx and honor a retry policy; at-least-once
  delivery is the promise — consumers must be ready to dedupe, and the event id is how.
- **Callbacks:** a callback the API makes to the consumer carries the same `event_id` as the original
  event — end-to-end dedupe.
- **Webhook security is part of the contract:** sign every delivery (HMAC-SHA256 over the raw body
  with a per-consumer secret, signature in a header like `X-Signature`), include the event's
  timestamp, and reject deliveries outside a replay window. Consumers verify the signature before
  trusting the payload — an unsigned webhook is an open write endpoint on the internet.

## Retry guidance to consumers

- Honor `Retry-After`; exponential backoff + jitter by default.
- Retry only when `retryable: true` (or the error is transport-level); `insufficient_funds` retried
  a thousand times is still insufficient funds.

## Bans (recap)

POST without a key path, keys that expire mid-flow, retry-safety guessed per endpoint, webhooks
without event ids, job failures with no failure state.
