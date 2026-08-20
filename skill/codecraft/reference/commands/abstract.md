# Command: abstract

Introduce the right abstraction — or delete the wrong one. The two-way command: half the craft is
building seams, the other half is tearing down seams that never earned their keep.

## When to introduce

1. **Second real consumer arrived** (or third occurrence of the pattern) — and both share the same
   reason to change (`duplication.md`).
2. **A boundary pays** — change rates differ, vocabularies differ, or lifetimes differ
   (`structure.md`). The seam lets each side change alone.
3. **Illegal states can be made unrepresentable** — a union/enum replaces a boolean pair; the type
   system becomes the abstraction.
4. **A name is struggling to be born** — a cluster of data + functions that keeps appearing together
   and has a domain name waiting (`shoppingCart`).

## When to delete

1. **Speculative generality** — the interface with one implementation, the factory for one product,
   the "future-proof" config layer nothing reads. YAGNI until the consumer exists.
2. **The wrong abstraction** — call sites fight it with special cases; every use bends the name.
   Deleting it and re-inlining often *reduces* total code.
3. **Layers that mirror** — pass-through wrappers that rename without translating.

## Steps

1. Inventory candidates in the target: seams with one consumer, duplicated clusters, struggling
   names.
2. Decide per candidate: introduce / delete / leave (with a written reason — every seam either pays
   rent or gets a receipt).
3. For introductions: name the abstraction by its job, define its narrow interface, move the
   consumers, delete the scattered logic, add the contract test.
4. For deletions: inline the abstraction into its consumers, delete the seam, run the tests — if
   inlining *adds* complexity, you misjudged and the abstraction stays.
5. Verify: tests green, the report lists each decision and its rent/receipt.

## Rules

- Never introduce an abstraction for one consumer "because it will need it." It won't, and when it
  does, it'll need a different one.
- Abstractions leak their implementation in their name or their parameters — a `PaymentGateway`
  with a `stripeToken` parameter is a seam that didn't take.
- Behavior preserved exactly; abstraction passes are not rewrite passes.
