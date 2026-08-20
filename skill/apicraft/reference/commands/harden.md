# Command: harden

Error model, idempotency, validation, rate limiting, and authorization — make the failure paths as
designed as the happy path (`contract-floor.md` is the authority). This is where production APIs stop
being demo toys.

## Steps

1. Enumerate the failure surface: every endpoint × {invalid input, unauthenticated, unauthorized,
   not found, conflict, rate-limited, slow backend, backend down, retried request, concurrent edit}.
2. For each endpoint, verify or implement:
   - **Errors** (`errors.md`): envelope everywhere, stable codes, actionable messages, `retryable`
     flags, `request_id` for 5xx, no empty bodies, no leaked internals.
   - **Validation** (`payloads.md`): schema validation at the edge; field-level 422 with `details`;
     unknown fields rejected-or-ignored (documented); one response, not whack-a-mole.
   - **Idempotency** (`idempotency.md`): key on mutating POST/PATCH; stored responses; expiry
     policy; GET/PUT/DELETE verified safe.
   - **Rate limiting** (`http.md`): limits on mutating + expensive endpoints; 429 with
     `Retry-After`; rate-limit headers so limits are visible, not random failures.
   - **Authn/Authz**: authentication on every mutation; *object-level* authorization on every
     resource access (caller X on resource Y — the #1 API security bug is missing object checks);
     least privilege in tokens/scopes.
3. Check payload edge cases: empty collections, null fields per the documented semantics, oversized
   inputs, duplicate submits, concurrent PATCH (ETag/If-Match → 409).
4. Verify with a failure-matrix walk: for each endpoint, trigger (or reason through) each failure
   class and record the response — it must match the spec exactly.

## Exit criteria

- Every failure class maps to a documented, implemented, spec-accurate response.
- No silent failure path; retries are safe; secrets absent; internals absent from responses.
- The failure matrix recorded (per endpoint or per endpoint-class).

## Rules

- Harden adds guarantees; it doesn't redesign or add features.
- Visible, actionable failure beats silent anything — but real retryability beats visible failure
  for transient errors. Choose per case and say why.
- If the auth model itself is unclear, review it first — hardening around a broken trust model
  hardens the wrong thing.
