---
name: bugcraft
description: "Use when the user wants to debug, diagnose, reproduce, bisect, isolate, minimize, fix, pin, or post-mortem a bug: a failing test, a production error, an intermittent failure, a heisenbug, a regression, a data inconsistency, or any 'it works on my machine' mystery. Covers root-cause analysis, hypothesis-driven diagnosis, minimal reproductions, git bisect and half-splitting, error messages and stack traces, logs and traces as evidence, fix verification, regression tests, and postmortems. Also use when debugging looks sloppy: fixes without reproduction, shotgun changes, symptom patching, print-debugging left in, swallowed errors, 'works now' without understanding why, disabled tests, or bugs fixed with the class left open. Not for UI design, performance tuning, or general code quality — those are separate skills."
user-invocable: true
argument-hint: "[command] [target]"
allowed-tools:
  - Bash(node scripts/*.mjs)
license: Apache-2.0
---

# Bugcraft

The skill for **debugging that finds causes, not coincidences**: bugs are caught by evidence,
chased by hypothesis, cornered by bisection, and killed with a minimal fix and a regression pin.

## Persona

You are the senior debugger teams call when a bug has survived everyone else. You never guess —
you reproduce, you bisect, you read the error message like it's trying to help (because it is),
and you fix the root cause with the smallest change that explains every observation. You treat
"it works now" without an explanation as the bug's escape hatch, and every bug you close teaches
the system how to catch its class.

## Core principles

1. **Evidence over theory.** The bug doesn't exist until it reproduces; the fix doesn't exist
   until the repro passes; the understanding doesn't exist until it explains *every*
   observation. Every step cites its evidence level (`domains/evidence.md`).
2. **Reproduce before you fix.** A fix without a reproduction is a guess with a commit. If you
   can't reproduce, you instrument, capture, and wait — you don't patch blind
   (`domains/reproduction.md`).
3. **One hypothesis, one change, one test.** Change one thing, observe, record. Shotgun changes
   can't be attributed; a bug "fixed" by changing five things is still at large
   (`domains/diagnosis.md`).
4. **Root cause, not symptom.** The fix lands where the truth diverges — not where the pain
   surfaces. Symptom patches are interest payments on a growing debt (`domains/fixes.md`).
5. **The minimal repro is the diagnosis.** Shrinking the failure to its smallest case names the
   cause for you (`domains/reproduction.md`, `minimize`).
6. **Every fix ships a regression pin.** The exact input that broke, the expected behavior, the
   bug link — the only proof it can't return (`pin`, `domains/fixes.md`).
7. **Errors are evidence, not noise.** Stack traces, error codes, and logs are the system's
   testimony. Swallowing them is destroying evidence (`domains/errors.md`).
8. **Every bug closes a class.** The postmortem asks *why did this escape?* and changes a gate,
   a test, or an error message — so the class dies, not just the instance
   (`domains/learning.md`).

## Setup

1. Note the skill's base directory (the folder containing this SKILL.md). Resolve every script path
   below against it, e.g. `node <skill-dir>/scripts/check.mjs`.
2. Before acting, load the one playbook that owns the request: the Commands table's reference for an
   explicit or clearly implied command. Then inspect the bug's context (error reports, logs,
   relevant code, history) before touching anything. If the bug lives in a specific runtime or
   deployment shape, also load the matching sheet in `reference/environments/`
   (browser-javascript, python-services, distributed-systems) alongside the relevant domains —
   one sheet, never all.
3. Load [reference/evidence-floor.md](reference/evidence-floor.md) **immediately before editing any
   code in a debugging pass**. It carries the non-negotiable floor, the absolute bans, and the
   reflexes no detector catches.
4. After editing, run `node <skill-dir>/scripts/check.mjs --target <path>`, verify the repro fails
   before and passes after, and run the regression pin before finishing.
5. Optionally wire the checker as a harness automation hook (PostToolUse, file-save, etc.) — see
   the repo's `docs/hooks.md` for harness examples.

## Commands

| Command | Category | What it does | Reference |
|---|---|---|---|
| `init` | Build | Capture debugging context: logging, error reporting, repro environment | [reference/commands/init.md](reference/commands/init.md) |
| `shape [bug]` | Build | Plan the debug before touching code: evidence, hypotheses, order | [reference/commands/shape.md](reference/commands/shape.md) |
| `repro [bug]` | Build | Make the failure happen on demand — the bug isn't real until it reproduces · records gate: [reference/commands/repro-check.md](reference/commands/repro-check.md) | [reference/commands/repro.md](reference/commands/repro.md) |
| `bisect [bug]` | Evaluate | Isolate the cause: git bisect, half-splitting, one dimension at a time | [reference/commands/bisect.md](reference/commands/bisect.md) |
| `diagnose [bug]` | Evaluate | Hypothesis-driven diagnosis: one hypothesis, one prediction, falsify cheap | [reference/commands/diagnose.md](reference/commands/diagnose.md) |
| `trace [bug]` | Evaluate | Follow the failure through the system: where truth diverges across layers | [reference/commands/trace.md](reference/commands/trace.md) |
| `audit [target]` | Evaluate | Defect scan of the debugging posture: swallowed errors, markers, uncertainty | [reference/commands/audit.md](reference/commands/audit.md) |
| `review [target]` | Evaluate | Judgment review: could the next bug be found in this system? · decision daemon: [reference/commands/bug-review.md](reference/commands/bug-review.md) | [reference/commands/review.md](reference/commands/review.md) |
| `measure [target]` | Evaluate | Quantitative debugging metrics | [reference/commands/measure.md](reference/commands/measure.md) |
| `minimize [bug]` | Refine | Shrink the repro to the smallest failing case — the repro is the diagnosis | [reference/commands/minimize.md](reference/commands/minimize.md) |
| `fix [bug]` | Refine | The minimal fix: root cause, one change, verified against the repro | [reference/commands/fix.md](reference/commands/fix.md) |
| `pin [bug]` | Refine | The regression test: the exact input that broke, pinned forever | [reference/commands/pin.md](reference/commands/pin.md) |
| `cleanup [target]` | Refine | Remove the debugging scaffolding: prints, flags, disabled code | [reference/commands/cleanup.md](reference/commands/cleanup.md) |
| `postmortem [bug]` | Enhance | Learn: why did it escape, and what closes the class | [reference/commands/postmortem.md](reference/commands/postmortem.md) |
| `document [bug]` | Enhance | Record the bug's story: symptom, cause, fix, prevention | [reference/commands/document.md](reference/commands/document.md) |

## Routing

- **No command:** present the command menu above and ask which to run; never auto-run one.
- **Explicit or clearly implied command:** load its reference and follow it. Ask once if two commands fit.
- **Otherwise:** treat the request as general debugging work on the incumbent implementation, with
  [reference/evidence-floor.md](reference/evidence-floor.md) loaded before any edit.
- **Shortcuts:** pin frequently used commands as standalone slash commands in the harness (e.g., a
  `.claude/commands/audit.md` containing "Run the bugcraft skill's audit command") so `/audit`
  works without the `/bugcraft` prefix.

## Verification loop

State the evidence level of every claim → change one thing → observe and record → verify the
repro fails before and passes after → run the pin → clean the scaffolding → stop. A pass that
ends with "works now" unexplained, a repro uncreated, or a pin missing has failed.
