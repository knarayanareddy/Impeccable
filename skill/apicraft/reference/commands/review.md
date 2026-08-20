# Command: review

Consumer-perspective design review with scoring. The judgment pass `audit`'s defect scan can't do:
would a developer integrating this API in an afternoon *enjoy* it, or fight it? No edits.

## Scorecard (1–5 each)

| Dimension | The question |
|---|---|
| Consumer ergonomics | Can a new consumer make the 3 most frequent calls without reading prose docs? |
| Resource modeling | Are the nouns right, the nesting sane, the endpoints job-shaped (`resources.md`)? |
| HTTP semantics | Methods, statuses, headers, caching used correctly (`http.md`)? |
| Error model | Would the consumer's error branch be pleasant to write (`errors.md`)? |
| Payloads | Types decided (dates, money, enums), nullability deliberate (`payloads.md`)? |
| Collections | Pagination, filtering, sorting coherent (`pagination.md`)? |
| Consistency | One casing, one envelope, one style — app-wide? |
| Idempotency & retries | Is retry-safety designed in (`idempotency.md`)? |
| Versioning & change policy | Can this API evolve without ambushing anyone (`versioning.md`)? |
| Contract quality | Is the spec complete, true, and reviewable (`specs.md`)? |

## Steps

1. Read the spec (or route code if no spec) as a consumer integrating for the first time.
2. Write the integration code for the three most frequent jobs *in your head* — note every place it
   stumbles.
3. Score each dimension with one "what's working" and one "what's not" line, citing the exact
   endpoint/field. No generic praise.
4. Deliver: the scorecard, the three highest-leverage fixes (ranked by consumer impact), and one
   "bold move" — the single change that would most elevate the API's feel.

## Rules

- Review from the consumer's side of the wire. "It's how the backend works" is never an answer to a
  consumer-ergonomics complaint.
- If the API has no spec, the first three findings are already written: no contract.
- No edits in review; follow-up commands pick up the ranked list.
