# Domain: Specs

The machine-readable contract is the API's source of truth: OpenAPI (REST), GraphQL SDL, or proto
(gRPC). If it isn't in the spec, it isn't in the API — the spec is written first, diffed in CI, and
reviewed like code.

## Spec-first workflow

1. **Shape → contract → code.** The spec is written (or updated) before or with the implementation;
   code is generated from it where the stack allows, and conforms to it everywhere else.
2. **The spec is reviewed.** A spec PR gets the same review as a code PR: would a consumer reading
   this diff understand the promise? Are errors, pagination, and nullability explicit?
3. **CI diffs spec vs implementation.** (openapi-diff, graphql-inspector, buf breaking for proto.)
   Drift fails the build — fix the code or change the spec deliberately, never let them drift
   silently.
4. **SDKs and docs are generated from the spec.** Hand-maintained parallel docs are drift by
   construction. One artifact, many outputs.

## OpenAPI quality bar

- Every endpoint: `summary` (what it does), all parameters with types + constraints, exact request
  and response schemas (required/optional/nullable stated), **every error response** via a shared
  error component, and at least one realistic example.
- `components.schemas` for reuse; the error envelope is one component referenced everywhere.
- Descriptions state the *finding* for the consumer ("Returns orders created after the given
  timestamp"), not the mechanism ("Queries the orders table").
- `deprecated: true` + description with the successor for anything in the sunset path.

## GraphQL SDL quality bar

- Every type and field has a description; enums documented per value; errors in the schema where the
  stack supports typed errors.
- `@deprecated(reason: "...use X...")` on anything heading out; no field renames without the old one
  deprecated.
- Nullability is a schema decision (nullable vs non-null is a contract, not a convenience).

## Proto quality bar

- Package/service/message names are the vocabulary; every message and field commented with the
  contract (units, ranges, semantics).
- `reserved` for removed field numbers/names; additive-only evolution; breaking changes = new
  package, run `buf breaking` in CI.

## Spec hygiene

- Examples are runnable (tested against the real API where possible) — an example that lies is worse
  than none.
- Security schemes declared (auth model visible in the spec), rate limits and headers documented.
- The spec version tracks the API version; the changelog links them.

## Bans (recap)

Spec-after-implementation (permanently), parallel human docs, example-less error schemas,
description-less types, unreserved removals, untested examples.
