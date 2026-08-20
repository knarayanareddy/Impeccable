# Domain: State & mutability

Where functions own behavior, this domain owns *state*: what changes, who changes it, and how
visible the change is. The modern consensus: **immutable by default, mutation in narrow scope,
and absence modeled explicitly.** Load alongside `functions.md` and `errors.md`.

## Immutability by default

- Prefer immutable data: `const`/`final`/`val` everywhere they apply; structs over mutation for
  derived values; `Object.freeze`-style sealing only where the language can't express it.
- Mutating an input argument is a defect unless the signature declares it (`out` params,
  `mut` receivers, documented in-place APIs) — the caller's data is the caller's, not a scratch
  buffer (`functions.md`'s in-out parameter ban is this rule's shadow).
- Derived state beats stored state: compute from the inputs rather than caching a flag that must
  be kept in sync. The stored flag is a lie waiting for one of its setters to miss an update
  (`complexity.md`'s state-sprawl smell).

## Null, optional, and absence

- **Model absence explicitly.** `Option`/`Optional`/nullable-with-contract, or an explicit
  sentinel type — never "null means not-found *and* error *and* empty" (`errors.md` #7's cousin).
- Prefer `Result`/`Either` over exceptions for *expected* failure paths where the language
  supports it; exceptions for programming errors (`errors.md`'s model rule).
- **Narrow the null's lifetime.** Nullable out → checked/non-null in, as close to the boundary
  as possible; the type system should guarantee non-null for the bulk of the code
  (codecraft's `harden` command enforces this at the edges).

## Mutation scope

- **Minimize the mutable surface.** One owner per piece of mutable state (a single struct, a
  single class, a single module) — mutation scattered across five files is a race condition
  waiting for a feature.
- **Locals mutate; shared state synchronizes.** A mutable local is a tool; mutable shared state
  is a contract — with the locking/atomic/immutable-snapshot analysis attached
  (perfcraft's concurrency domain is the deep end).
- **References over copies where identity matters, copies where safety matters** — decide per
  type and say which, in the type's doc comment.

## State machines over flags

- Booleans grow into enums (`dbcraft`'s types domain agrees): two booleans that interact are a
  4-state machine wearing two names. Model the state explicitly — the type system then makes
  illegal transitions unrepresentable (the highest-leverage simplification in typed languages).
- Pin the transitions in tests: every legal transition gets a case, and the forbidden ones get
  an assertion that they fail (testcraft's cases domain owns the mechanics).

## Global state

- Global mutable state is a review blocker by default: it breaks test isolation
  (`testcraft`'s isolate command exists because of it), parallel reasoning, and refactoring.
- Where globals are unavoidable (process config, caches), they are injected (a config struct
  passed down, a cache interface), never read directly — the seam is the discipline
  (`domains/structure.md`'s config rule).

## Bans (recap)

Mutated inputs, stored-where-derived-works, null-as-multiple-meanings, scattered mutation
ownership, flag pairs that hide a state machine, unsynchronized shared mutable state, global
state read directly.
