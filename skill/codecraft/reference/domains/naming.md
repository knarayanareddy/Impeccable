# Domain: Naming

Names are claims. A bad name is not a cosmetic issue — it is the most common way lies enter a codebase.

## The rules

1. **Precise over polite.** The name states exactly what the thing is and does, no more. `retryPayment`
   beats `handleFailure`; `pendingOrder` beats `data`.
2. **Verbs for functions, nouns for types/variables, predicates for booleans.** Functions do
   (`calculateTax`, `renderTable`), types and variables are (`Invoice`, `taxRate`), booleans ask
   (`isExpired`, `hasPermission`, `shouldRetry`).
3. **Names are scoped claims.** Short names only where scope is short (`i` in a 3-line loop, `e` in a
   5-line catch). The wider the scope, the more specific the name.
4. **One word per concept.** Pick `fetch` or `get` or `load` — not all three for the same operation.
   The codebase's existing choice wins (`align`).
5. **Domain vocabulary over invented vocabulary.** Use the words the users/domain already use
   (`settlement`, not `moneyFinalize`). The code should read like the business.
6. **No type names in names** (`strName`, `listUsers`, `userArray`) — the type system already carries
   that; the name carries the role.
7. **No vagueness in signatures.** `data`, `info`, `tmp`, `result`, `obj`, `thing`, `value` are banned
   in public signatures. If you cannot name it, you do not understand it yet — understand first.
8. **Match the platform's idiom** (`domains/idioms.md`): Go's short names, Python's `snake_case`,
   JS's `camelCase`, Rust's `snake_case` + type `PascalCase`. Breaking platform idiom reads as a bug
   to native readers.
9. **Length tracks importance.** The more readers depend on the name, the more syllables it can afford.
   A module name can be long; a loop variable cannot.
10. **Rename when the claim changes.** After any behavior edit, re-read the names the edit touched. A
    name that now lies is the oldest bug in the book — and `name` exists for exactly this.

## Tests for a name

- Can the next reader use it correctly without reading the implementation? (necessary)
- Can they search for it and find what they expect? (necessary)
- Would the author have chosen it a month later, after the code evolved? (the lie test)

## Bans (recap)

Type prefixes, vague signature names, generic verbs (`handle`, `process`, `manage`), inconsistent
concepts, abbreviations only the author knows, names that lie.
