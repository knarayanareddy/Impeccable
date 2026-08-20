# Domain: HTTP semantics

REST APIs inherit a 30-year-old shared language. Using it correctly is free leverage: caches,
proxies, SDKs, and every developer on earth already know the words. Using it wrong costs forever.

## Methods

| Method | Meaning | Safety | Idempotent |
|---|---|---|---|
| GET | Read | safe | yes |
| HEAD | Read headers | safe | yes |
| POST | Create / act / query-by-body | unsafe | no (needs Idempotency-Key) |
| PUT | Replace (full) | unsafe | yes |
| PATCH | Partial update | unsafe | not by default |
| DELETE | Remove | unsafe | yes |

Rules:
- GET/HEAD never change state — caches, crawlers, and retries all assume this.
- POST creates *new* resources (201 + Location); PATCH/PUT mutate existing; PUT is full replacement
  (absent fields are removed or defaulted — say which).
- DELETE is idempotent: deleting twice succeeds (204/404 both acceptable; pick one and be consistent).

## Status codes

| Code | Use for |
|---|---|
| 200 | Success (with body) |
| 201 | Created (return the created resource + `Location`) |
| 202 | Accepted (async job started; link the status endpoint) |
| 204 | Success, no body (deletes, no-ops) |
| 400 | Malformed request (bad JSON, missing required field at the transport level) |
| 401 | Unauthenticated (who are you?) |
| 403 | Authenticated but not allowed (who you are isn't enough) |
| 404 | Resource not found (or hidden for 403-reasons — document which) |
| 409 | Conflict with current state (duplicate, version mismatch) |
| 422 | Valid JSON, invalid values (field-level errors) |
| 429 | Rate limited — **always with `Retry-After`** |
| 500 | Unexpected server failure |
| 503 | Down for maintenance / overloaded |

Rules:
- Never 200-with-error-body. Never 500 for client mistakes. Never 401 when you mean 403.
- 202 means "the work hasn't happened yet" — the response must say how to find out when it has.

## Headers

- `Location` on 201. `Retry-After` on 429 and 503. `Content-Type` always; honor `Accept`.
- `ETag`/`If-Match` for optimistic concurrency on mutable resources (409 on mismatch).
- Rate-limit headers (`RateLimit-Limit/Remaining/Reset` or the `X-RateLimit-*` set) on limited
  endpoints — rate limits without visibility are just random failures.
- `Idempotency-Key` on POST/PATCH where consumers retry (`domains/idempotency.md`).

## Caching

- `Cache-Control` on GETs with explicit freshness; private data → `private, no-store` or equivalent.
- Don't cache what can't be cached and pretend otherwise; don't leave cacheable GETs uncached for no
  reason. Caching is a consumer-facing performance feature, not a server internals detail.

## Bans (recap)

GET with side effects, method salad (POST for everything), 200-as-error, 500-as-validation,
429-without-Retry-After, ignored content negotiation, missing Location on create.
