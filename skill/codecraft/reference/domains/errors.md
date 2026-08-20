# Domain: Errors

Error handling is where codebases quietly die. The floor is simple: **no failure path may be silent.**

## The error model (pick the platform's, then be consistent)

- **Exceptions** (JS/TS, Python, Java, C#...): throw for programming errors and truly exceptional
  conditions; handle where you can act. Never use exceptions for control flow.
- **Result types / error returns** (Go, Rust, functional styles): errors are values the caller *must*
  reckon with. The compiler helps — use it.
- One model per codebase; mixing "throw in half the layer, return null in the other" is the fastest
  way to unhandled failures.

## Handling, not catching

Every catch/except must do one of these four things — nothing else:

1. **Recover** — there is a real, intended fallback (`retry with backoff`, `serve from cache`).
2. **Translate** — convert to the caller's error vocabulary with the operation in the message:
   `throw new ConfigError("load config: " + err.message, { cause: err })` / `fmt.Errorf("load config: %w", err)`.
3. **Report and continue** — log with context (operation, inputs, error) and a comment saying *why*
   continuing is correct here.
4. **Propagate** — let it bubble, by design, to a boundary that handles it.

`catch {}` / `except: pass` is a defect, not a style choice (`anti-patterns.md` E1).

## Error messages

- State the operation, the subject, and the fix when known: `"save invoice #102: credit card expired"`.
- Errors are for the *caller*, not the author: no "Error:", no exclamation marks, no stack traces to
  users, no two-letter codes without a legend.
- Wrap at each layer boundary that adds meaning; don't re-wrap at every frame.

## Fail fast and validate at the edges

- Validate inputs at the boundary of trust (API surface, config load, DB read): reject early with a
  precise error rather than corrupting state downstream.
- Invariants asserted where they're established, not where the crash would eventually surface:
  `assert(taxRate >= 0)` at the point of computation.
- Preconditions stated in the contract (doc comment or type), enforced in code.

## Nulls, optionals, and sentinels

- Never return magic values for failure (`-1`, `null` meaning "error", empty string meaning "no
  result") without an explicit contract. Use `Option`/`Result`/nullable-with-doc, or exceptions,
  per the platform.
- Distinguish "empty" from "error": an empty list is a valid answer; `null` is not a synonym.

## Edge cases that must be named

Every function's contract covers: empty input, zero/negative values, very large values, nil/null,
duplicate keys, concurrent access, timeout, and partial failure. `harden` exists to walk this list
systematically.

## Bans (recap)

Swallowed errors, contextless rethrows, magic-value failures, exceptions for control flow, catching
the root exception type blindly, error messages written for the author.
