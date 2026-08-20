# Domain: Assertions

Assertions are where a test says what it means. A weak assertion is the difference between a green
lie and a pinned contract. This domain is the heart of `strengthen`.

## The strength ladder (weak → strong)

1. **Existence** — `expect(x).toBeDefined()` / `not.toBeNull()`. Says "something exists". Almost
   always too weak — the next assertion was the point.
2. **Truthiness** — `toBeTruthy()` / `assert x`. Passes for wrong-but-truthy values (0 vs "0" vs
   [] vs "false").
3. **Exact value** — `toEqual(expected)` / `== expected`. The workhorse: pins the contract.
4. **Shape + value** — `toMatchObject({...})` / `toMatchInlineSnapshot` (reviewed). Pins the
   structure where the whole object would be noise.
5. **State & effects** — the row now exists in the DB, the event was emitted, the file written.
   The strongest assertions are often about the world, not the return value.
6. **Errors with contracts** — `toThrow("insufficient_funds")` / `rejects.toMatchObject({code})`.
   Error *codes and types*, never message substrings that reword.

## The rules

- **Assert the outcome, not the journey.** Return values, persisted state, emitted effects, thrown
  contracts — not "function f was called with g". (Interaction assertions are for the boundary
  mocks only — `domains/fakes.md`.)
- **One assertion of the contract, as many as the contract has parts.** A contract with three
  fields gets three assertions in one test — splitting them into three tests re-runs setup for
  nothing (`anti-patterns.md` W5's flip side).
- **Expected values are computed by hand.** The moment the expected value is computed by calling
  the code under test, the test is circular and the assertion is theater.
- **Failure messages are written for the future engineer.** Custom messages ("expected status
  'closed' after cancel — got X") when the framework's diff wouldn't say it.
- **Snapshots are assertions too** — reviewed per diff, bounded in size, kept for stable shapes
  only (`anti-patterns.md` W2).

## The weak-assertion list to hunt in `strengthen`

`toBeTruthy`/`toBeFalsy` as the final answer · `toBeDefined`/`not.toBeNull` alone ·
`assert x` · `expect(fn).not.toThrow()` as the whole test · `toHaveLength` without content ·
snapshot-without-review · `assertCalled`-only tests.

## Bans (recap)

Truthiness finals, existence-only checks, circular expected values, message-substring error
asserts, unreviewed snapshots, assert-on-mock-only tests.
