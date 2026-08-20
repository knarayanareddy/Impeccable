# Command: contract

Write or update the machine-readable contract — the source of truth. The signature command of this
skill (`domains/specs.md` is the authority).

## Steps

1. Locate the spec (from API.md or by finding OpenAPI/GraphQL/proto files). If none exists, create
   one in the conventional location and record it in API.md.
2. For the endpoint(s) in scope, write the contract completely:
   - REST: path + method, `summary`, all parameters (types, constraints, required/optional), exact
     request/response schemas with nullability stated, **every error response** via the shared error
     component, and a runnable example.
   - GraphQL: types and fields with descriptions, nullability as a decision, `@deprecated` where due.
   - gRPC: messages with contract comments (units, ranges, semantics), `reserved` for removals.
3. Reuse components (`components.schemas`, shared types) — the error envelope is one component, used
   everywhere (`domains/errors.md`).
4. Reconcile with the implementation:
   - Spec-first (no code yet): mark the contract as the target; code follows it.
   - Existing code: diff code vs spec (openapi-diff or equivalent). Every mismatch is a decision:
     fix the code or update the spec — with the compatibility consequences of each named.
5. Review the diff as a consumer: does it state the promise precisely? Would generated SDKs work?
6. Add or update the CI spec-diff gate so drift fails the build.

## Exit criteria

- The spec fully describes the endpoint(s): parameters, schemas, errors, example, nullability.
- Spec and implementation agree (or the drift is recorded as deliberate with a date).
- The error envelope is one shared component; conventions from API.md hold.

## Rules

- The spec is code: reviewed, versioned, and never written as an afterthought.
- Never document an endpoint that doesn't exist yet without marking it (e.g., in a spec branch) —
  the spec must never advertise promises the API can't keep.
