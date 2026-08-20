# Command: modernize

Bring the target onto the language's current stable idioms — the ones the ecosystem's own tools
recommend (`domains/idioms.md` is the authority).

## Steps

1. Determine the platform baseline: the language version the project targets (from config/CODEBASE.md
   — never modernize past what the toolchain supports). If the project is Go, TypeScript, Python,
   or Rust, load the matching `reference/idioms/` sheet — it is the language authority for this
   command.
2. Inventory legacy patterns in the target, e.g.:
   - JS/TS: `var` → `const`/`let`, `==` → `===`, callbacks → async/await, `for` loops → iterator
     methods where clearer, `function` → arrow where context fits.
   - Python: `%`-format → f-strings, `Optional` → `X | None` (3.10+), manual loops → comprehensions
     where readable, `open` without context manager → `with`.
   - Go: manual loops → `slices`/`maps` helpers, `interface{}` → generics/`any`, string concat in
     loops → `strings.Builder`.
   - Java/C#: raw types → generics, manual null checks → `Optional` where idiomatic, boilerplate →
     records.
   (This list is illustrative — verify against the actual ecosystem at the time of use.)
3. Replace in one focused batch, one pattern at a time, keeping the diff mechanical.
4. Respect the codebase's frozen zones from CODEBASE.md — legacy conventions that are policy stay.
5. Verify: tests/types green, formatter clean, and each change is explainable in one line ("var →
   const: block scoping"). If any replacement makes the code *less* readable in context, revert that
   one — idiom serves clarity, not vice versa.

## Rules

- Modernize the constructs, never the architecture. This is not a rewrite command.
- No new dependencies to be "modern" — if the idiom needs a library the project doesn't use, skip it.
- Stop before churn: a file that was modernized six months ago needs nothing.
