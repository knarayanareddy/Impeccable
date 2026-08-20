# Anti-patterns: the code-slop tells

The fingerprints of code written by an agent (or a rushed junior) with no reviewer. Each is a defect
in the craft sense — not always a bug today, always a bug factory tomorrow. Most have a deterministic
rule in `scripts/check.mjs`; the rest are LLM-judged with this file loaded.

## Structure tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| S1 | God functions (50–200+ lines, many jobs) | Unreviewable, untestable, unnameable | Extract one job per function (`extract`) |
| S2 | Deep nesting (>4 levels) | Cognitive stack overflow; the reader re-derives state | Early returns, guards, extract (`flatten`) |
| S3 | God files (600+ lines mixing concerns) | No module boundary = no ownership | Split by responsibility (`structure.md`) |
| S4 | Copy-paste duplication | Every copy diverges into a bug | `dedupe` — but only at 3+ occurrences |
| S5 | Premature abstraction (one-off interface, speculative base class) | Wrong abstraction costs more than duplication | Delete it (`abstract`) |
| S6 | Boolean flag parameters | Call sites become unreadable riddles | Split functions or named options object |

## Naming tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| N1 | `data`, `info`, `tmp`, `result`, `obj`, `item` in signatures | Names nothing; the reader must infer from usage | Name the role (`invoice`, `pendingOrder`) |
| N2 | Names that lie after an edit (`getUser` that writes) | The oldest bug in the book | Rename on every behavior change (`name`) |
| N3 | Generic verbs: `handle`, `process`, `manage`, `doThing` | Every function "handles" something | Name the action: `retryPayment`, `parseConfig` |
| N4 | Type names in variable names (`strName`, `listUsers`) | Redundant; decays into lies | Drop the prefix (`users`) |
| N5 | Abbreviations only the author knows (`calcFnTrx`, `usrPrm`) | Opaque to every future reader | Spell it out unless it's domain-standard (`id`, `url`) |

## Value tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| V1 | Magic numbers (`if (x > 47)`, `sleep(300)`) | The *why* lives only in the author's head | Named constant with the reason in the name |
| V2 | Magic strings (`status === "P"`) | Typos compile; meaning rots | Enum/constant — the domain's vocabulary |
| V3 | Stringly-typed code (states as strings, config as maps) | The type system can't help you | Enums, union types, real config structs |
| V4 | `any` in TypeScript | Deletes the safety the language exists for | `unknown` + narrowing, or the real type |

## Error-handling tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| E1 | Swallowed errors (`catch {}`, `except: pass`) | Failure is now silent and unstoppable | Handle, rethrow with context, or log-and-explain |
| E2 | Rethrow without context (`throw err`) | The trace loses *what was being done* | Wrap with the operation: `fmt.Errorf("load config: %w", err)` |
| E3 | Errors returned as magic values (`return -1`, `return null`) | Callers forget to check; meaning is implicit | Result types / exceptions / sentinel with contract |
| E4 | Catching `Exception`/`Error` and continuing blindly | One handler for everything handles nothing | Catch the specific error you can act on |
| E5 | Success measured by not crashing | A failed save that logs nothing is still failed | Every failure path visible and explicit |

## Comment tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| C1 | Obvious comments (`// increment i`, `// the constructor`) | Noise that trains readers to skip comments | Delete (`document`) |
| C2 | Commented-out code blocks | Ambiguity: is it coming back? is it safe to delete? | Delete — git remembers |
| C3 | Comments that explain *what* instead of *why* | The code already says what | Keep only rationale, invariants, tradeoffs |
| C4 | Comment rot (comments that now lie) | Worse than no comment at all | Update or delete on every edit |
| C5 | TODO sprawl (5+ in one file, no owner) | The design is unfinished, not the code | Finish it or file it with an owner |

## Hygiene tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| H1 | `console.log` / `print(` / `debugger` left in | Slipped-through debugging = unpolished | Delete or route through the project's logger |
| H2 | Unexplained suppressions (`@ts-ignore`, `eslint-disable`, `noqa`) | Hides real problems from the next reader | Fix the code, or name the rule + reason |
| H3 | Loose equality in JS/TS (`==`) | Type-coercion bugs with zero upside | `===` always |
| H4 | `var` in modern JavaScript | Hoisting + scoping footguns | `const`/`let` |
| H5 | Dead imports/params/variables | The reader chases ghosts | Delete; let the linter prove it |
| H6 | Inconsistent local style (two naming conventions, mixed quotes) | Breaks the reader's pattern-matching | `align` to the surrounding file |

## Detector mapping

`scripts/check.mjs` deterministically catches: V1 (magic numbers), E1 (swallowed errors), H1 (debug
statements), V4 (`any`), H2 (suppressions), H3 (loose equality), H4 (`var`), C2 (commented-out code),
S2 (deep nesting), S3 (long files), C5 (TODO sprawl), N2-ish (vague names in signatures). The rest are
LLM-judged — keep this file loaded when auditing or reviewing.
