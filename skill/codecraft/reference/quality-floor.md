# Quality floor

Load this file **immediately before editing code**. It is the non-negotiable floor, the absolute bans,
and the reflexes no detector catches. When the codebase's own conventions are stricter, theirs win.

The numeric ceilings below (function lines, nesting, parameters, file lines) are tunable per
project via CODEBASE.md / `.codecraft/config.json` (see `assets/codecraft.config.example.json`);
the bans and reflexes are not. State and mutability rules live in `domains/state.md` — load it
with this file when the pass touches state, nulls, or mutation.

## The floor

1. **Behavior contract first.** Before refactoring, state what must not change (outputs, side effects,
   error behavior, API shape) and verify it after — via tests, types, or a recorded before/after
   transcript. Untested behavior change is a bug, not a refactor.
2. **Function size.** Default ceiling ~30 lines per function; ~50 for a single well-named switch/
   dispatch. Longer needs a written justification that names the reader question it answers.
3. **Nesting depth.** Max 3 levels of control flow inside a function by default; 4 justified. Beyond
   that: extract or early-return (`flatten`).
4. **Parameters.** Max 3–4; more means a missing struct/object/parameter-object — or a function doing
   too much. No boolean flag parameters (`save(true, false, true)`) — split the function or use a
   named options object.
5. **Naming.** Every name states its claim precisely (`domains/naming.md`): verbs for functions,
   nouns for types/variables, booleans as predicates (`is`, `has`, `should`), no `data`/`info`/`tmp`/
   `result` vagueness in signatures, no names that lie after an edit.
6. **No magic numbers or strings.** Literals get a named constant or an enum — except 0, 1, and
   self-evident loop/idiom constants. The name must explain *why* the value is what it is.
7. **Errors never swallowed.** Every catch/except either handles the error (recover, retry, degrade),
   rethrows with context, or explicitly logs and continues *with a comment saying why*. Bare
   `catch {}` / `except: pass` is a defect.
8. **No dead code.** No commented-out blocks, no unreachable branches, no unused parameters/variables/
   imports, no functions nobody calls. Git is the archive; the file is not.
9. **Comments earn their place.** Comments explain *why* (rationale, invariants, tradeoffs), never
   *what* (the code says that). Every comment must survive the "would the next reader ask this?"
   test; every TODO carries an owner/issue or a concrete trigger.
10. **Suppressions are admissions.** Every `eslint-disable`, `@ts-ignore`, `noqa`, `nolint` names the
    rule it disables and the reason — or it gets deleted and the code gets fixed.

## Absolute bans (deterministic — most are caught by `scripts/check.mjs`)

- Magic numbers/strings in logic
- Swallowed exceptions (`catch {}`, `except: pass`)
- Left-behind debug statements (`console.log`, `print(`, `debugger`, `var_dump`, `fmt.Println`)
- `any`-typed escape hatches in TypeScript (`: any`, `as any`) — `unknown` exists for a reason
- Unexplained suppressions (`@ts-ignore`, `eslint-disable`, `noqa`, `nolint`)
- Loose equality in JS/TS (`==`, `!=`)
- `var` in modern JavaScript
- Commented-out code blocks (the file is not a museum)
- Nesting deeper than 4 levels
- Files grown past ~600 lines without a plan to split
- TODO/FIXME sprawl (5+ in one file = the design is unfinished, not the code)

## Reflexes (no detector catches these)

- **Simplify or justify** — on every non-trivial construct you touch, ask "what rent does this pay?"
  and be able to answer in one sentence.
- **Read the diff as the reviewer, not the author.** Would you let this merge if a stranger wrote it?
- **The smallest change that achieves the goal is the best change.** A craft pass that rewrites more
  than it needs to has become an ego pass.
- **Conventions are context.** Before changing style, check what the surrounding file does — local
  consistency beats imported rules.
- **Duplication is a question, not always a bug.** Two occurrences: leave it. Three+: ask whether the
  abstraction would be *right* (same reason to change) or *wrong* (rule of three, AHA).
- **Names age; refresh them.** After an edit, re-read the names the edit touched — a name that now
  lies is a bug in waiting.
- **The reader's four questions** — what does this do, why does it exist, what must be true, what
  happens on failure? Every function should answer them at a glance.
