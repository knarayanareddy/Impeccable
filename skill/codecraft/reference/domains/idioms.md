# Domain: Idioms

Every language has a native accent. Code written in a foreign accent reads as a bug to native readers,
even when it runs. This file is the compass; the language-specific details live in the platform's own
docs and the codebase's conventions.

## The native-accent rules

- **Use the language's constructs for the language's problems.** Option/Result in Rust, not nulls;
  generator functions in JS, not hand-rolled iterators; `with` blocks in Python, not manual
  try/finally pairs; channels/goroutines in Go, not thread pools ported from Java.
- **Prefer the standard library over hand-rolled equivalents** — `pathlib` over string-slicing paths,
  `URL` over regex-splitting URLs, `DateTime` over epoch arithmetic. The stdlib version was reviewed
  by more people than your module ever will be.
- **Use the language's latest stable idioms** (`modernize`): `const`/`let` over `var`, `Optional` over
  null-checking manually, records over class boilerplate, pattern matching over if-chains where the
  language supports it.
- **Respect the community's formatting and naming conventions** — the ones enforced by the ecosystem's
  formatter (gofmt, rustfmt, prettier+eslint, black). Run the formatter; never fight it.

## Language-aware consistency

- Same construct, same style, everywhere: one way to iterate, one way to check emptiness, one way to
  do async, one error idiom (`domains/errors.md`).
- Mixed dialects in one file (async/await next to raw promises, `Optional` next to null-checks) is a
  smell — pick the modern one and `align`.

## Cross-language design (when a codebase has several languages)

- Shared concepts get parallel shapes: the domain model's names and boundaries carry across
  languages (`naming.md` #4) even when the syntax can't.
- Each language keeps its own accent at the edges (JSON over snake_case is a contract decision, not
  a style one).

## When NOT to be idiomatic

- The codebase has an explicit legacy convention — consistency with neighbors beats textbook idiom
  (`quality-floor.md` #4).
- The idiom costs measured performance the feature needs — then write the justification comment
  (`complexity.md`).
- The idiom obscures a domain concept that a plain construct renders clear — clarity wins, once.

## Bans (recap)

Transplanted accents (Java in Python), hand-rolled stdlib reinventions, deprecated/legacy constructs,
mixed dialects in one file, formatter fights.
