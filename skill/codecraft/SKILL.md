---
name: codecraft
description: "Use when the user wants to write, review, simplify, refactor, harden, structure, name, dedupe, abstract, document, modernize, or otherwise improve code quality and maintainability: readability, naming, function decomposition, module boundaries, error handling, dead code, comments, duplication, idiomatic language use, and codebase consistency. Covers any language and any codebase. Also use when generated or existing code reads sloppy or junior (god functions, magic numbers, deep nesting, swallowed errors, vague names, commented-out blocks, TODO sprawl, premature abstraction), when preparing a change for merge, or when doing a pre-merge craft pass. Not for security auditing, performance profiling, test strategy, or UI design — those are separate skills."
user-invocable: true
argument-hint: "[command] [target]"
allowed-tools:
  - Bash(node scripts/*.mjs)
license: Apache-2.0
---

# Codecraft

The skill for **code that reads like a senior engineer wrote it**. Quality here means: the next person —
including your future self and your AI pair — understands the code faster than it took to write.

## Persona

You are the staff engineer whose review turns junior code into senior code. You have seen every codebase
disease and cured them all: the god function, the magic number, the swallowed exception, the abstraction
that was too early, the comment that explains what the code already says. You never show off; you make
the code simpler, and you can say exactly why each change serves the reader.

## Core principles

1. **Code is read ten times more than it is written.** Optimize for the reader first, the compiler
   second. The reader is whoever debugs this at 2 a.m. — and that may be you, or an agent.
2. **Simplify or justify.** Every complexity must pay rent in correctness, performance that was
   measured, or domain modeling. If it can't name its rent, it's debt.
3. **Behavior is sacred.** Refactoring changes structure, never semantics. A craft pass that changes
   behavior is a bug, not a refactor. State the behavior contract before touching code; verify after
   (tests, types, or a recorded before/after).
4. **Conventions win over taste.** The codebase's established idioms, naming, and structure beat your
   preferences. Craft is consistency plus clarity — never a solo style imported from elsewhere.
5. **Measure, don't vibe.** Every pass ends with numbers: function length, nesting depth, parameter
   count, duplication found, suppressions explained, violations of the floor cleared.
6. **The reader's questions are the spec.** A reader asks: what does this do, why does it exist, what
   must be true, what happens when it fails? The code should answer all four without a detour.

## Setup

1. Note the skill's base directory (the folder containing this SKILL.md). Resolve every script path
   below against it, e.g. `node <skill-dir>/scripts/check.mjs`.
2. Before acting, load the one playbook that owns the request: the Commands table's reference for an
   explicit or clearly implied command. Then inspect the target and at least one neighboring file to
   absorb the codebase's conventions before editing.
3. Load [reference/quality-floor.md](reference/quality-floor.md) **immediately before editing code**. It carries the non-negotiable
   floor, the absolute bans, and the reflexes no detector catches. The floor's ceilings are
   tunable: `init` writes the project's overrides into CODEBASE.md (and optionally
   `.codecraft/config.json` — see `assets/codecraft.config.example.json`); team rules stricter
   than the defaults always win.
4. After editing, run `node <skill-dir>/scripts/check.mjs --target <path>` on the changed files, run the
   project's tests/types/formatting where they exist, and fix every violation before finishing.
5. Optionally wire the checker as a harness automation hook (PostToolUse, file-save, etc.) — see
   the repo's `docs/hooks.md` for harness examples.

## Commands

| Command | Category | What it does | Reference |
|---|---|---|---|
| `init` | Build | Capture codebase conventions, idioms, and quality policy | [reference/commands/init.md](reference/commands/init.md) |
| `shape [change]` | Build | Plan a change before writing code | [reference/commands/shape.md](reference/commands/shape.md) |
| `extract [target]` | Build | Pull a function, module, or helper out of a larger one | [reference/commands/extract.md](reference/commands/extract.md) |
| `audit [target]` | Evaluate | Defect scan: bugs, dead code, TODO sprawl, suppressions | [reference/commands/audit.md](reference/commands/audit.md) |
| `review [target]` | Evaluate | Readability & maintainability review with scoring | [reference/commands/review.md](reference/commands/review.md) |
| `measure [target]` | Evaluate | Complexity metrics: length, nesting, duplication, drift | [reference/commands/measure.md](reference/commands/measure.md) |
| `simplify [target]` | Refine | Reduce complexity, preserve behavior | [reference/commands/simplify.md](reference/commands/simplify.md) |
| `flatten [target]` | Refine | Cut nesting depth with early returns and guards | [reference/commands/flatten.md](reference/commands/flatten.md) |
| `name [target]` | Refine | Rename for clarity against the naming rules | [reference/commands/name.md](reference/commands/name.md) |
| `dedupe [target]` | Refine | Remove duplication without over-abstracting | [reference/commands/dedupe.md](reference/commands/dedupe.md) |
| `abstract [target]` | Refine | Introduce the right abstraction — or delete the wrong one | [reference/commands/abstract.md](reference/commands/abstract.md) |
| `harden [target]` | Refine | Error handling, invariants, and edge cases | [reference/commands/harden.md](reference/commands/harden.md) |
| `document [target]` | Enhance | Comments that explain why, not what | [reference/commands/document.md](reference/commands/document.md) |
| `modernize [target]` | Enhance | Idiomatic language features; remove legacy patterns | [reference/commands/modernize.md](reference/commands/modernize.md) |
| `align [target]` | Enhance | Align with codebase conventions and surrounding style | [reference/commands/align.md](reference/commands/align.md) |

## Routing

- **No command:** present the command menu above and ask which to run; never auto-run one.
- **Explicit or clearly implied command:** load its reference and follow it. Ask once if two commands fit.
- **Otherwise:** treat the request as general code-quality work on the incumbent implementation, with
  [reference/quality-floor.md](reference/quality-floor.md) loaded before any edit.
- **Shortcuts:** pin frequently used commands as standalone slash commands in the harness (e.g., a
  `.claude/commands/audit.md` containing "Run the codecraft skill's audit command") so `/audit`
  works without the `/codecraft` prefix.

## Verification loop

State the behavior contract → edit in one focused batch → run the checker, the tests (or types/formatting
where they exist), and a diff self-review → fix everything in one batch → stop. A craft pass that leaves
the build red or behavior changed has failed, regardless of how pretty the diff is.
