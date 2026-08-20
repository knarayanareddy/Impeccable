# Command: measure

The quantitative pass. Numbers, not adjectives. Complements `review` (judgment) and `audit`
(defects). No edits.

## What gets measured

1. **Surface size** — total endpoints; endpoints per resource; params per endpoint (max and
   distribution); nesting depth per path.
2. **Contract coverage** — endpoints in code vs endpoints in the spec (undocumented count and %);
   endpoints in spec missing from code; spec schema completeness (schemas with all errors declared).
3. **Semantics violations** — verbs in URLs, GET side effects, 200-with-error, 500-for-validation,
   429-without-Retry-After (checker + inspection counts).
4. **Consistency** — casing violations (mixed files), distinct error envelope shapes in use, distinct
   pagination styles in use, date format variants, enum vocabulary variants per concept.
5. **Collection hygiene** — unpaginated list endpoints, unbounded page sizes, endpoints without
   documented sort keys, filter parameter variants for the same concept.
6. **Retry safety** — mutating POSTs with vs without an idempotency path (%).
7. **Security basics** — mutating endpoints without authn checks, hardcoded credentials (checker),
   endpoints lacking rate-limit headers where limits exist.
8. **Versioning** — endpoints versioned vs not; deprecations with vs without successors.

## Output

A measurement report: per-metric table with numbers, the floor comparison against
`contract-floor.md`, then the ranked delta list — cheapest change to highest consumer impact.

## Rules

- Every number cites its method (checker / spec cross-ref / inspection). If a metric can't be
  measured with available tooling, report "not measured" — never guess.
- Quote before/after numbers around any subsequent refactor pass — that's how API craft becomes
  visible.
