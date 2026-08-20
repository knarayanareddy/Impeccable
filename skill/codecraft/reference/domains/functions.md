# Domain: Functions

Functions are the unit of readability. Most craft problems are function-shape problems.

## One job per function

A function has one job when it can be named with a single precise verb + noun (`validateEmail`,
`persistOrder`) and everything inside serves that job at one level of abstraction. The smell: parts of
the body that would need their own heading if written as prose. Extract them.

## Size and shape

- Default ceiling ~30 lines; ~50 for a well-named single dispatch/switch. Longer requires a written
  justification that names the reader question it answers (`quality-floor.md`).
- A function should read top-to-bottom in steps of the same grain: no "one 3-line step followed by a
  40-line detour" — the detour is another function.
- Single level of abstraction per function. Business rules and byte-shuffling don't mix in one body.

## Parameters

- Max 3–4. Beyond that, the parameters hide a concept — a struct/object/parameter-object.
- **No boolean flags** (`save(true, false, true)`). Split into two functions or use a named options
  object whose fields read as sentences (`{ dryRun: true }`).
- Parameters ordered by role: the subject first (`copy(source, destination)`), options last.
- No in-out parameters (mutated arguments) unless the language's idiom demands it; return the result.

## Command/query separation

A function either does something **or** answers something — never both. `getUser()` must not write;
`saveUser()` must not quietly read-and-decide. The #1 source of "names that lie" is functions that do
both. Split into `getX` + `applyX` and call sites get clearer for free.

## Control flow

- **Early returns over else.** Guard clauses at the top (`if (!input) return err`), the happy path
  straight down, nesting minimal. The reader holds a checklist, not a stack.
- Loop bodies ≤ ~15 lines; the body is a candidate function with a name that describes the per-item job.
- One `return` per exit is *not* a virtue when it forces nesting — clarity beats ceremony.

## Purity

- Prefer pure functions (same input, same output, no hidden state) for anything that computes. They
  are testable for free and reviewable in isolation.
- Impure parts (I/O, state) get pushed to the edges — `load` at the top, `persist` at the bottom, pure
  logic in the middle. This shape alone resolves half of all review arguments.

## Bans (recap)

God functions, mixed abstraction levels, boolean flags, >4 params, in-out params, command/query
mixture, else-chains that guard clauses would dissolve, loop bodies that need their own table of
contents.
