# Idiom sheet: Rust

Loaded alongside `domains/idioms.md` when the project is Rust. The native-accent specifics;
the compass is the idioms domain.

## Ownership & borrowing (the language's discipline)

- Borrow before clone: `&T` and `&mut T` are the default; `.clone()` is a deliberate,
  commentable decision on a hot or awkward path — clone-spray is the Rust code-smell.
- Lifetimes stay inferred until the compiler asks; when annotations appear, the shortest
  lifetime that satisfies the borrow is the one.
- Interior mutability (`RefCell`, `Mutex`) only where the borrow checker names a real need —
  a `RefCell` pile is usually a design problem wearing a type.

## Errors & options (the spine)

- `Result<T, E>` for fallible, `Option<T>` for absence — never `unwrap`/`expect` in
  production paths; `?` propagation with context via `map_err`/`.context()` (anyhow at the
  boundary, thiserror for the library's typed errors).
- The library/application error split: typed enums in libraries (pattern-matchable),
  `anyhow::Result` at the application edge where errors are logged, not matched
  (`domains/errors.md`'s model rule).

## Pattern matching & types

- Match exhaustively; `_ =>` only when the domain genuinely ignores the rest — non-exhaustive
  matches are the compiler's free tests (`domains/state.md`'s "make illegal states
  unrepresentable", natively).
- Newtypes for domain-safe types (`struct UserId(u64)`) over bare primitives where identity
  and units matter; enums over bool-pairs, always.

## Concurrency & structure

- `Send + Sync` discipline; shared state via `Mutex`/`RwLock`/channels with the ownership
  analysis written down (perfcraft's concurrency domain is the deep end).
- Modules mirror the domain, not the layer (`domains/structure.md`); `rustfmt` + `clippy
  -- -D warnings` in CI; `Cargo.lock` committed for binaries (pinned) — libraries follow
  the ecosystem's convention.

## Bans

`unwrap`/`expect` in prod paths, clone-spray, stringly errors, `unsafe` without the
`// SAFETY:` contract comment, bool-pairs where an enum exists, trait-object ceremony where
generics fit.
