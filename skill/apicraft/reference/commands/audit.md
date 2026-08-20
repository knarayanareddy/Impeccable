# Command: audit

Defect scan: semantics, pagination, errors, versioning, and security basics. Finds and ranks — it
does not fix. No code or spec edits.

## Steps

1. Run `scripts/check.mjs --target <path>` for the deterministic set (verbs in URLs, GET side
   effects, deep nesting, success wrappers, leaked internals, unbounded pagination, hardcoded
   credentials, ambiguous dates, mixed casing, missing spec...).
2. Enumerate every endpoint (from code + spec) and check each:
   - **Semantics** (`domains/http.md`): method matches intent; status codes correct; 201 has
     Location; 202 links the job; no 200-with-error, no 500-for-validation.
   - **Errors** (`domains/errors.md`): envelope consistent; stable `code`s; no empty bodies; no
     internals.
   - **Collections** (`domains/pagination.md`): every list paginated, capped, stable ordering;
     filter/sort vocabulary documented.
   - **Idempotency** (`domains/idempotency.md`): mutating POSTs have a key path; retry-safety
     stated.
   - **Versioning** (`domains/versioning.md`): policy exists; no semver-in-path; deprecations have
     successors.
   - **Security basics**: authn on all mutations; object-level authz (can caller X touch resource
     Y?); rate limits with headers; validation at the edge; no secrets.
3. Cross-check spec vs implementation: endpoints in code but not in spec (and vice versa) are
   findings.
4. Output a ranked punch list: severity (Blocker / Major / Minor / Nit), endpoint, rule, and the
   fix. Blockers = contract-floor violations. Sort by severity, then by consumer impact.

## Rules

- Cite the exact endpoint and status/field for every finding — never vague impressions.
- Audit does not edit. The fix is a follow-up command (`align`, `harden`, `paginate`, `contract`...).
- End with a one-line verdict and counts per severity.
