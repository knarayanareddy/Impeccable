# Anti-patterns: the API-slop tells

The fingerprints of an API designed by an agent (or a team) that has never been a consumer of its own
endpoints. Each is a defect — not always a crash today, always a consumer-tax forever. Most have a
deterministic rule in `scripts/check.mjs`; the rest are LLM-judged with this file loaded.

## Routing tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| R1 | Verbs in URLs (`GET /api/getUser`, `POST /users/delete`) | The method is the verb; the path names the resource | `GET /users/{id}`, `DELETE /users/{id}` |
| R2 | GET with side effects (`GET /api/cart/checkout`) | Caches, crawlers, retries all re-trigger it; violates the contract of GET | `POST` for anything that changes state |
| R3 | Nesting deeper than 2 resources (`/users/{id}/orders/{id}/items/{id}/files`) | Brittle paths, awkward middleware, unreadable URLs | Flatten: `/files?order_id=...` or `/orders/{id}/files` |
| R4 | Everything-is-POST RPC (`POST /doThing`, `POST /process`) | Throws away caching, idempotency, and the shared vocabulary of HTTP | Use the method + status semantics that already exist |
| R5 | Unversioned public endpoints (`/api/orders` with no version) | The day a breaking change is needed, there is nowhere to go | `/api/v1/...` or an explicit version header |

## Status & error tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| E1 | 200-with-error-body (`200 { "error": "not found" }`) | Clients, caches, and logs all misread the outcome | Real status: 404, 409, 422... |
| E2 | 500 for validation (`500 { "error": "email invalid" }`) | Blames the server for the client's input; pages the wrong team | 400/422 with field-level errors |
| E3 | `{success: false}` wrappers | The status code already says failure; the wrapper invents a parallel truth that drifts | Standard envelope: code + message + hint |
| E4 | Empty error bodies (`500` with no body) | The consumer can't react programmatically | The error envelope, always |
| E5 | Leaked internals (stack traces, SQLSTATE, file paths) | Security hole + noise the consumer can't use | Log internals server-side; return code + message + retry hint |

## Payload & field tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| P1 | Stringly enums with no vocabulary (`status: "in-progress"` vs `"in_progress"` vs `"2"` across endpoints) | Consumers can't write reliable matching | One documented enum vocabulary per concept |
| P2 | Ambiguous dates (`created_at: "2026-08-20"` — local? UTC? time?) | Sorting, filtering, and display all silently break | RFC 3339 + explicit timezone (`2026-08-20T14:32:00Z`) |
| P3 | Null-everything (`"deleted_at": null` meaning "not deleted" and "unknown" and "never") | One value, three meanings | Distinguish omitted / null / empty deliberately; document the choice |
| P4 | Mixed field casing (`user_id` next to `userId`) | Consumers guess per field forever; SDK generation breaks | One casing convention, app-wide (`align`) |
| P5 | Redundant wrappers (`{"data": {"data": [...]}}`) | Extra indirection with no meaning | Flatten to one level; the envelope is already `data` |

## Collections & lifecycle tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| C1 | Unpaginated collections (returns all 90,000 rows) | Latency, memory, and consumer code all blow up at once | Cursor (or offset) + capped limit + stable order |
| C2 | Unbounded page sizes (`?limit=100000`) | Consumers will ask; someone will pay | Cap the max (100–500), document it |
| C3 | No stable ordering ("sort by insertion" that changes) | Pagination pages overlap and skip rows | Explicit stable sort; cursor encodes it |
| C4 | Ad-hoc filter vocabulary (`?search=`, `?q=`, `?query=` all meaning different things) | Undiscoverable, inconsistent, unmaintainable | One filter vocabulary with documented operators (`domains/pagination.md`) |
| C5 | Silent breaking changes (rename a field, "improve" a response, fix a "bug" consumers depend on) | The cardinal sin: consumers break without warning | Additive changes; renames/removals via versioning + deprecation |
| L1 | No machine-readable contract (docs in a wiki, spec in a slide deck) | Nothing to diff, test, or generate SDKs from | OpenAPI / GraphQL SDL / proto as source of truth |
| L2 | Spec drift (spec says one thing, code does another) | The contract lies; consumers integrate against a rumor | CI spec-diff; fix code or spec, never both drift |

## Detector mapping

`scripts/check.mjs` deterministically catches, with these rule ids: `verb-in-url` (R1),
`get-with-side-effects` (R2), `deep-resource-nesting` (R3), `unversioned-api` (R5),
`success-wrapper` (E3), `empty-error-body` (E4), `leaked-internals` (E5), `unbounded-page-size`
(C2), `select-star` (C1), `no-retry-after` (E5/429), `date-as-string` (P2), `mixed-field-casing`
(P4), `hardcoded-credential` (S1), `minor-version-in-path` (R5), `no-spec-file` (L1). The rest
are LLM-judged — keep this file loaded when auditing or reviewing.
