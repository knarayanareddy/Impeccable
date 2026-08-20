# Command: paginate

Bring collections to the pagination standard (`domains/pagination.md` is the authority). The single
most common API defect class — and the most mechanical to fix well.

## Steps

1. Enumerate every list endpoint in the target and its current behavior: bounded? ordered? filtered?
   sortable? (The checker flags the deterministic subset: `SELECT *` without limit, page sizes
   > 500.)
2. For each, decide and implement:
   - **Style:** cursor by default; offset only where the UI genuinely needs page numbers. State the
     choice in the spec.
   - **Limit:** default 20–50, cap 100–500, enforced in code and documented.
   - **Ordering:** explicit stable default sort; `sort` allowlist with directions; deterministic
     tie-break (id as final key).
   - **Response:** `{items, next_cursor, has_more}` (or `page`/`total` where offset); pagination
     state in `meta`, never per item.
   - **Filters:** the documented vocabulary (`?status=`, `?created[gte]=`) with stated operators;
     free-text search with stated semantics.
3. Update the spec: parameters, response schema, and the default/max limits in the descriptions.
4. Verify: empty page, last page, boundary at cap, deep cursor, concurrent insert mid-pagination —
   the page snapshot stays consistent (`pagination.md` #4).

## Guardrails

- Never silently change pagination on a public API — additive parameters only; behavior changes are
  a version/deprecation decision (`versioning.md`).
- Cursor must be opaque: consumers never parse it, and the server may re-encode it at any time.
- Don't add `total` counts "because it might be useful" — `has_more` covers most UIs and is nearly
  free (`pagination.md` #3).

## Exit criteria

- Every collection bounded, ordered, filterable per the vocabulary, and spec-accurate; caps
  documented; checker clean.
