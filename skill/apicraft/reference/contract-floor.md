# Contract floor

Load this file **immediately before editing any API surface**. It is the non-negotiable floor, the
absolute bans, and the reflexes no detector catches. When the team's published API conventions are
stricter, theirs win.

## The floor

1. **Every endpoint is in the spec.** The machine-readable contract (OpenAPI, GraphQL schema, proto)
   describes every endpoint, field, and error before or with its implementation. Spec drift is a
   defect, not a todo — CI diffs the spec against the implementation.
2. **Status codes mean the standard thing.** 200/201/202/204 for success; 400/401/403/404/409/422/429
   for client errors; 500/503 for server errors. Never 200-with-an-error-body, never 500 for
   validation, never custom codes without a documented reason.
3. **One error envelope, everywhere.** Every error response: correct status + stable machine-readable
   `code` (a constant string, not a message) + human `message` + what to do next + `retryable` flag
   where meaningful. Consumers match on `code`, never on `message`.
4. **Collections are bounded.** Every list endpoint paginates with a capped limit and stable ordering;
   unbounded responses are a defect (`domains/pagination.md`).
5. **Retries are safe.** GET/HEAD/PUT/DELETE idempotent by design; POST/PATCH honor an
   `Idempotency-Key` (or equivalent); webhook deliveries carry a stable event id consumers can dedupe
   (`domains/idempotency.md`).
6. **One casing, one date format, one vocabulary.** Field casing consistent app-wide; dates RFC 3339
   with explicit timezone; money as integer minor units or decimal string + currency code; enums as
   stable strings, never magic numbers.
7. **Nullability is deliberate.** Omitted, `null`, and empty mean three different things — each
   endpoint states which it uses and why (`domains/payloads.md`).
8. **Every mutation is authenticated and authorized.** AuthN + AuthZ on every mutating endpoint, with
   object-level checks (can this caller touch *this* resource?); no secrets in code, no internals in
   responses.
9. **Validation at the edge.** Inputs validated against the schema at the boundary with field-level
   errors (422/400) before any state changes; unvalidated input is a defect.
10. **Versioning policy exists.** How breaking changes ship (major version / deprecation window /
    sunset headers) is written down and followed; additive changes never break consumers.

## Absolute bans (deterministic — most are caught by `scripts/check.mjs`)

- Verbs in URLs (`/getUser`, `/users/delete`) — the HTTP method is the verb
- GET with side effects
- Resource nesting deeper than 2 levels (`/users/{id}/orders/{id}/items/...`)
- `{success: true}` / `{ok: true}` wrappers around responses
- Error responses with empty bodies (`res.status(500).send()`)
- Stack traces, SQLSTATE, or internals in responses
- `SELECT *` without a limit in API paths
- 429 without `Retry-After`
- Page sizes > 500 or unbounded (`limit: 10000`)
- Hardcoded credentials/API keys in code
- Dates as untyped strings (`createdAt: string`) — no format, no timezone
- Mixed field casing in one file (snake_case next to camelCase)
- Semver in URL paths (`/v1.1/...`) — major version only
- Unversioned `/api/` endpoints (public/partner APIs)
- No machine-readable spec file anywhere in the project

## Reflexes (no detector catches these)

- **Write the consumer's code first.** Before finalizing any shape, write the three most frequent
  calls as consumer code. If they're ugly, redesign.
- **The worst-consumer test.** For every endpoint ask: what happens on retry, duplicate, empty
  result, missing field, oversized input, slow backend, concurrent edit? If the answer is "surprise",
  that's a defect.
- **Names are frozen vocabulary.** A field or path name, once public, is permanent. Spend the
  extra minute naming it; `rename` costs a deprecation cycle.
- **The next version is the tax bill.** Every special case in v1 becomes either a breaking change or
  a wart in v2. Design v1 like v2 is already watching.
- **Errors are the API too.** Consumers write error-handling code first — their error branch is often
  more important to them than your happy path.
- **Consistency beats local elegance.** A locally prettier field name that breaks app-wide consistency
  is a worse API.
- **The spec is reviewed, not just written.** Review the spec diff like code: would a consumer
  reading this diff understand the promise being made?
