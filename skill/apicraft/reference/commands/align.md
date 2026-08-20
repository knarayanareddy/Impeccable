# Command: align

Align the API to its own conventions: one casing, one error envelope, one pagination style, one date
format, one vocabulary. The highest-leverage consistency pass in existence — consumers feel it on the
first two calls. Load `contract-floor.md` before editing.

## Steps

1. Establish the local truth from API.md (or the dominant convention in the spec/code if API.md is
   missing — and offer to create it).
2. Inventory deviations per axis:
   - **Casing** (`payloads.md`): snake vs camel vs mixed; per-file mixing (checker flags).
   - **Errors** (`errors.md`): envelope shapes in use; codes that duplicate meaning; messages as
     codes.
   - **Pagination** (`pagination.md`): offset here, cursor there, `page` vs `limit` vs `per_page`.
   - **Dates/money/enums**: format variants per concept.
   - **Naming**: one concept, two field names (`user_id` vs `owner_id` for the same thing).
3. Fix by the local truth:
   - **Public APIs:** alignment ships as additive change — new canonical field alongside the old,
     old deprecated with a successor note (`rename`, `deprecate`). Never a silent swap.
   - **Internal APIs:** direct change with all call sites updated in the same diff.
4. Update the spec and examples in the same change; add a CI check that enforces the convention
   going forward (linter rule, schema check, spec-diff).
5. Verify: spec diff clean, checker clean on the target, consumer behavior unchanged where public.

## Exit criteria

- One convention per axis across the surface; deviations enumerated as either fixed, deprecated-with-
  successor, or documented exceptions (with a date).
- The consistency report lists what changed and what was deliberately deferred.

## Rules

- Align does not redesign. Same endpoints, same semantics — only the vocabulary converges.
- If the codebase's own convention contradicts the industry norm, the codebase wins (consistency
  beats elegance — `contract-floor.md`).
