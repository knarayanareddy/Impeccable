# Command: shape

Model resources, endpoints, and payloads before writing code. Shape owns the design reasoning; the
contract command owns the spec artifact.

## Steps

1. Restate the need as a consumer story: "A [consumer] can [job] by calling [something]." If the
   story can't be stated, ask — never design a solution for an unnamed job.
2. Model the resources (`domains/resources.md`): the nouns, their relationships, cardinality, and
   ownership. Decide nesting (max 2 levels) and where identity lives (path vs query).
3. Define the operations the jobs need — not CRUD ritual. For each: method, path, request payload,
   response payload, success status, and the *error cases* (at least: not found, invalid input,
   conflict, unauthorized).
4. Write the consumer's calling code for the three most frequent jobs, in the consumer's language.
   If it's ugly, revise the shape now — this is where API design actually happens.
5. Decide the hard questions explicitly: pagination style and cap (`domains/pagination.md`),
   idempotency key for mutating POSTs (`domains/idempotency.md`), nullability semantics
   (`domains/payloads.md`), and which fields are required.
6. List the breaking-change risk of each decision (a name here is permanent) and note alternatives.

## Deliverable

A short design: consumer story → resource model → endpoint table (method/path/payloads/status/
errors) → consumer code snippets → open decisions with recommendations. No implementation code, no
spec yet — wait for approval, then hand off to `contract`.

## Rules

- Shape never edits code or specs. It ends where the contract begins.
- Respect API.md conventions; a shape that violates them must say why.
- Every endpoint in the plan answers a named job — if you can't name the job, cut the endpoint.
