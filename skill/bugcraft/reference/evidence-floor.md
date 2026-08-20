# Evidence floor

Load this file **immediately before editing any code in a debugging pass**. It is the
non-negotiable floor, the absolute bans, and the reflexes no detector catches. When the team's
published debugging standards are stricter, theirs win.

## The floor

1. **The bug exists when it reproduces.** A failure you cannot reproduce is a suspicion, not a
   bug. Fixes without reproduction are guesses with commits — instrument, capture, and wait
   instead (`domains/reproduction.md`).
2. **One hypothesis, one change, one observation.** Each debugging step changes exactly one
   thing and records the result. A bug "fixed" by changing five things is still at large
   (`domains/diagnosis.md`).
3. **The fix explains every observation.** The winning hypothesis accounts for the reported
   symptom *and* the odd details — the timing, the specific value, the specific user. A cause
   that explains only the headline symptom is a suspect, not the culprit.
4. **Root cause, not symptom.** The change lands where the truth diverges — a bad assumption, a
   boundary missed, a state unmodeled — not where the pain surfaced. Symptom patches are
   interest payments (`domains/fixes.md`).
5. **Every fix ships a regression pin.** The exact input that broke, the expected behavior, and
   the bug link — in a test that fails on the old code and passes on the new (`pin`).
6. **No evidence destroyed.** Swallowed exceptions, catch-and-return-null, log-and-continue
   without a reason — each deletes the error before anyone reads it (`domains/errors.md`).
7. **The debugging scaffolding ships nothing.** Print statements, debug flags, disabled code,
   and temporary logging leave before merge — the crime scene is cleaned (`cleanup`).
8. **"It works now" is a hypothesis, not a conclusion.** Green after a change proves the change
   did something; the explanation of *why* is the fix. No explanation, no closure
   (`domains/evidence.md`).
9. **Errors are written for the next debugger.** Error messages carry operation, subject, cause,
   and fix — the 3 a.m. engineer's first input (`domains/errors.md`, `apicraft`'s errors domain
   agrees).
10. **Every bug closes a class.** The postmortem names the gate, test, or error message that
    would have caught the class — and ships it (`domains/learning.md`).

## Absolute bans (deterministic — most are caught by `scripts/check.mjs`)

- Debug markers shipped: `console.log("here")`-family, `debugger;`, `print("xxx")`
- Log-and-swallow: `catch { console.log(err) }` — the error logged and dropped
- Swallowed exceptions: `catch {}` / `except: pass`
- Silent returns from catch: `catch { return null }` / `except: return None`
- Disabled code blocks: `if (false)`, `if (true) { /* debug */ }`, `while (false)`
- Commented-out debug lines (`// console.log(...)`) — evidence left in the crime scene
- Uncertainty markers without owners: `// hack`, `// workaround`, `// why does this work?`,
  `// don't touch this`, `// works on my machine`
- Tests disabled to reach green (`skip` on the failing test as the "fix")
- Fix commits with no test changes and no documented verification

## Reflexes (no detector catches these)

- **Read the error message first.** The stack trace, the code, the log — the system is telling
  you what it knows. Debuggers who skip the testimony re-discover the obvious.
- **The cheapest falsification first.** Rank hypotheses by the cost of disproving them; test
  the cheapest that kills the most candidates. Diagnosis is elimination, not inspiration.
- **The weird detail is the clue.** The bug's most specific fact — the exact value, the exact
  time, the exact user — is the one that doesn't fit the wrong theories. Chase the anomaly.
- **The fix is as small as the cause.** If the fix must be large, the cause isn't understood
  yet — shrink the repro instead of the codebase.
- **Two bugs are two passes.** A repro that fails for two reasons is two bugs wearing one
  symptom. Split before fixing.
- **The next bug is already seeded.** Ask what *else* shares the broken assumption — same
  boundary, same nullability, same migration pattern. The class fix covers them too.
- **Blameless curiosity beats blame.** The bug is the system's feedback; the postmortem's
  question is "what allowed it", never "who wrote it".
