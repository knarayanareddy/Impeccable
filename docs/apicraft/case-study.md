# Case study: the generic AI API → the apicraft pass

A before/after case study driven by the deterministic checker and the contract-diff — the
measured transformation, both directions.

## The before

A typical AI-generated orders API (`demos/apicraft/before-handler.js` +
`before-spec.yaml`): a hardcoded API key, a verb in the URL (`/api/getUser`), a success wrapper
with a leaked stack trace, `SELECT *`, an unbounded page size (10,000), a 500 with an empty
body, a GET-side-effect path (`/api/users/delete`), a 429 without Retry-After, unversioned
endpoints, and a spec with operations missing responses and operationIds.

The checker's verdict (`node skill/apicraft/scripts/check.mjs --strict`):

```
ERROR hardcoded-credential  before-handler.js:5   apiKey = "<redacted>"
ERROR verb-in-url           before-handler.js:7   /api/getUser
ERROR leaked-internals      before-handler.js:9   err.stack in the response
ERROR verb-in-url           before-handler.js:18  /api/users/delete
WARN  select-star           … "SELECT * FROM users"
WARN  unbounded-page-size   … 10000
WARN  empty-error-body      … 500 with no body
WARN  get-with-side-effects … GET /api/users/delete
WARN  no-retry-after        … 429 without Retry-After
WARN  unversioned-api       … /api/ endpoints
WARN  spec-missing-responses / spec-missing-operationid

apicraft: 2 file(s) scanned · 4 error(s), 12 warning(s) · FAILED
```

## The pass

One apicraft pass — `align` (versioned, verb-free resources), `harden` (the RFC 9457 problem
envelope, idempotency keys, capped pagination), `contract` (every operation with operationId,
parameters, schemas, and declared errors) — produces `demos/apicraft/after-handler.js` +
`after-spec.yaml`: the same jobs, stated as promises, with bound parameters, projected columns,
secrets from the environment, and a complete machine-readable contract.

```
apicraft: 2 file(s) scanned · 0 error(s), 0 warning(s) · clean ✓
```

## The contract-diff shows the honest cost

`node skill/apicraft/scripts/contract-diff.mjs before-spec.yaml after-spec.yaml` reports the
before→after rewrite as **breaking** — 6 breaking changes (removed operations, retyped
fields). That is the point of the tool: a real migration ships as a versioned release with a
deprecation window, and the diff is the justification for the version bump. The case study
doesn't hide the cost — it makes the cost visible.

## The claim

The transformation is verifiable in both directions, and the *cost* of the transformation is
measurable too. Contract craft with a receipt.
