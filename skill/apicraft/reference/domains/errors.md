# Domain: Errors

Errors are the most-used part of most APIs — consumers write their error branch before their happy
path. Design errors like the product feature they are.

## The error envelope (one shape, everywhere)

```json
{
  "error": {
    "code": "insufficient_funds",
    "message": "The account has insufficient funds for this transfer.",
    "details": [
      { "field": "amount", "issue": "exceeds_balance", "limit": 1250 }
    ],
    "retryable": false
  }
}
```

- **`code` is the contract.** A stable, documented, machine-readable string. Consumers match on it,
  never on `message`. Never reuse a code for two meanings; never change a code's meaning.
- **`message` is for humans** at 2 a.m.: what happened, in the consumer's words, no blame, no
  apologies, actionable.
- **`details`** carries field-level and structured info (validation issues, rate-limit windows,
  conflicting resource).
- **`retryable`** tells consumers whether retrying helps — the difference between a resilient
  integration and a thundering herd.
- Status code is chosen first, then `code` within it. The envelope is identical for 400, 401, 403,
  404, 409, 422, 429, 500, 503.

## Choosing codes and codes

- 400 = the request is unparseable or missing transport-level requirements.
- 401 = auth is missing/invalid → `code: "unauthenticated"`.
- 403 = authn succeeded, authorization didn't → `code: "forbidden"` (or `insufficient_scope`).
- 404 = resource absent (or hidden — document the policy).
- 409 = the state changed under the caller → `code: "conflict"` + the current `ETag` if useful.
- 422 = values invalid → `details` with per-field issues, the field name, the issue code, and the
  constraint violated (`min`, `max`, `pattern`).
- 429 = rate limited → `Retry-After` header + `details` with the window and limit.
- 500 = the consumer did nothing wrong. Say it ("Internal error — retry or contact support") and give
  a `request_id` that correlates with server logs.

## Error hygiene

- Log the stack server-side; return code + message + request_id. Never leak stack traces, SQLSTATE,
  file paths, or internal names (`anti-patterns.md` E5) — they're noise to consumers and gold to
  attackers.
- Errors are deterministic: the same failure yields the same code forever. Codes get versioned with
  the API, never repurposed.
- Validate everything at the edge and return field errors in *one* response — not a series of
  whack-a-mole 400s as the consumer fixes one field at a time.

## Webhooks & async errors

- Async failures get a status resource the consumer can poll (`GET /jobs/{id}` → `failed` +
  error envelope) — never a silent void.
- Webhook error responses use the same envelope; the sender logs the consumer's 4xx/5xx with the
  event id for debugging (`domains/idempotency.md`).

## Bans (recap)

Messages as codes, 200-as-error, empty error bodies, leaked internals, per-field whack-a-mole,
codes that change meaning, retryable left off when it matters.
