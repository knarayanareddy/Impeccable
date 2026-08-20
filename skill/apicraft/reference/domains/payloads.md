# Domain: Payloads

Payloads are where the promise gets specific. Every field is a permanent decision — consumers write
parsing code against it on day one and live with it for a decade.

## Casing and naming

- **One casing convention, app-wide.** Choose for the consumer's ecosystem (snake_case for
  Python/Ruby-first, camelCase for JS-first) and enforce it mechanically. Mixed casing is the
  fastest way to look like nobody owns the API (`anti-patterns.md` P4).
- Field names are vocabulary: nouns for data (`created_at`), predicates for booleans (`is_active`),
  no type prefixes (`str_name`), no abbreviations the docs don't define.
- Never rename a field once it ships. `rename` = add new field + deprecate old (`commands/rename.md`).

## Types that deserve a decision

| Concept | Sloppy encoding | The decision |
|---|---|---|
| Dates/times | `"2026-08-20"` or epoch ints with no context | RFC 3339 + explicit timezone; UTC as the interchange default (`2026-08-20T14:32:00Z`) |
| Money | float (`19.99`), bare number | Integer minor units (`1999`) or decimal string, always with `currency` (`"USD"`) |
| Enums | numbers (`status: 2`), free text | Stable string vocabulary, documented per field, extensible without breaking |
| IDs | auto-increment ints leaking volume | Opaque, stable IDs (ULID/UUID) — never reuse, never expose sequence |
| Booleans | `0/1`, `"true"/"false"` | Real booleans, predicate names |
| Binary | base64-in-JSON | URL (signed if needed) + media type + hash |

## Nullability: omitted ≠ null ≠ empty

- **Omitted** = "not provided / not applicable" (sparse responses, optional inputs).
- **`null`** = "the value exists and is nothing" (a person with no middle name).
- **Empty** (`""`, `[]`, `{}`) = "the value is present and empty".
- Pick the mapping per field, state it in the spec, and use it consistently. `"deleted_at": null`
  meaning three things is a defect (`anti-patterns.md` P3).

## Response shape

- One envelope level: `{"data": ..., "meta": {...}}` or bare `data` — never `{"data": {"data": [...]}}`.
- Collection meta: pagination fields (`next_cursor`, `has_more`) live in `meta`, never per item.
- Optional expansion via `?expand=` or `include` — related resources on demand, not always, not
  never.
- Sparse fields: `?fields=id,name` for fat resources; document the default field set.
- Response schemas in the spec are exact (required/optional/nullable stated) — a consumer should be
  able to generate a client type from them without reading prose.

## Request payloads

- Required vs optional stated; unknown fields rejected or ignored (pick one, document it).
- Batch endpoints: accept arrays, return per-item results with per-item errors — never
  all-or-nothing unless atomicity is the product.
- Patch semantics explicit: which fields replace, which merge, which can't change.

## Bans (recap)

Floating money, timezone-less dates, stringly booleans, null-means-three-things, double envelopes,
undocumented default field sets, rename-by-replace.
