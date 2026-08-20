# Style sheet: GraphQL

Loaded with `domains/resources.md` and `domains/specs.md` when the API is GraphQL. The style-
native specifics; the compass domains still hold (versioning, error contracts, consumer-first).

## The schema is the whole contract

- The SDL is the product: type and field names are permanent vocabulary (`naming` rules at
  their strictest — every field appears in every client's query).
- Nullability is a contract decision per field (`String!` vs `String`), made deliberately and
  documented — not a convenience default. Non-null where absence would be a client bug; nullable
  where the domain allows absence (`domains/payloads.md`'s omitted-vs-null law applies).
- Enums for every closed vocabulary — never stringly statuses (`dbcraft`'s types domain agrees).
  Adding enum values is additive; removing or renaming one is breaking.

## Evolution (additive-only in practice)

- New fields, new types, new enum values: free. Field arguments can gain optional parameters.
- Renames, removals, and type changes are breaking — there is no `/v2` for GraphQL in the REST
  sense: mark the old field `@deprecated(reason: "...use X...")` and remove only after real
  usage dies (`versioning.md`'s deprecation protocol, in-schema).
- `schema` breakage = client breakage: schema diffs run in CI (graphql-inspector-style) and a
  breaking diff fails unless the change is the stated release purpose.

## N+1 is the GraphQL disease

- Resolvers batch: `DataLoader`-style per-request batching for any field that resolves a list
  of related objects — the naive resolver turns one query into one-per-row (`perfcraft`'s data
  domain is the authority on the loop).
- Field-level complexity caps and depth limits are part of the contract (`domains/abuse.md`
  from seccraft applies): a queryable graph without limits is a DoS surface.

## Errors are typed where the stack allows

- Error extensions carry a stable `code` (the envelope's `code` member, `domains/errors.md`);
  partial success (some fields failed) is a designed, documented outcome — never an accident.
- Validation errors map to field-level `details` in the same envelope shape as REST.

## Bans

Renames without `@deprecated`, nullability-by-default, stringly enums, resolver N+1s,
unbounded query depth/complexity, breaking schema diffs shipped silently.
