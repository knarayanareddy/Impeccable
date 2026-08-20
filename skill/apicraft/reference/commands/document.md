# Command: document

Make the spec complete, true, and consumer-grade (`domains/specs.md` is the authority). The goal is
not more prose — it's a contract a consumer can integrate against without reading anything else.

## Steps

1. Cross-check the spec against the code: every endpoint present, every parameter and field typed
   and constrained, every error response declared, nothing in the spec that the code doesn't do.
2. Fill the gaps per the quality bar:
   - **Summaries** state the finding for the consumer ("Returns orders created after the given
     timestamp"), not the mechanism ("Queries the orders table").
   - **Parameters:** types, constraints (min/max/pattern/enum), required vs optional, defaults.
   - **Schemas:** nullability and optionality explicit; shared components reused; the error envelope
     is one component everywhere.
   - **Errors:** every endpoint lists its error responses with the envelope; codes documented with
     their meaning and fix hints.
   - **Examples:** realistic and runnable — test them against the real API where possible.
3. Descriptions pass: read each description as a consumer who knows nothing — does it answer "what
   do I send, what do I get, what can go wrong, and what do I do then?"
4. Wire the generated artifacts: SDKs and docs render from the spec; delete hand-maintained parallel
   docs or mark them as derived (drift by construction otherwise).
5. Add the CI spec-diff gate if missing — documentation that can't drift is the only documentation
   that stays true.

## Rules

- An example that lies is worse than no example. Test examples or remove them.
- Never document future endpoints in the main spec ("coming soon" paths) — the spec advertises only
  real promises.
- Documentation is part of the contract: a doc fix that changes the promise is a versioning event,
  not a typo fix.

## Exit criteria

- Spec/implementation diff empty; every endpoint consumer-complete (summary, params, schemas,
  errors, example); generated docs/SDKs in place; CI gate on.
