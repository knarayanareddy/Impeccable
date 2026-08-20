# Anti-patterns: the debugging-slop tells

The fingerprints of debugging done by an agent (or a team) that fixed the feeling instead of the
cause. Each is a defect — not always a wrong fix today, always a wrong confidence forever. Most
have a deterministic rule in `scripts/check.mjs`; the rest are LLM-judged with this file loaded.

## Evidence tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| E1 | Fixing without a reproduction | The change is a guess with a commit; nothing proves it did anything | `repro`: make it fail on demand, then fix |
| E2 | "It works now" without an explanation | The bug escaped through the hole in the reasoning | `diagnose`: the cause that explains all observations |
| E3 | Shotgun changes (five things at once) | Attribution is impossible; the real cause is still at large | One hypothesis, one change (`diagnose`) |
| E4 | Symptom patching (handle the crash, not the cause) | The debt compounds with interest | `fix`: land where the truth diverges |
| E5 | Fixing the test instead of the code (weakening the assertion to go green) | The suite now blesses the bug | `pin` the contract; the test was right |

## Diagnosis tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| D1 | Confirmation bias (looking for the favorite cause) | The evidence that disproves it is ignored | Rank and falsify, cheapest first (`diagnose`) |
| D2 | Guessing without hypotheses (random poking) | Each poke teaches nothing generalizable | One hypothesis, one prediction, one observation |
| D3 | Ignoring the weird detail (the exact value, the exact time) | The anomaly is the clue that breaks the wrong theory | Chase the specific; it doesn't fit for a reason |
| D4 | Blaming the layer you know (the classic "it's the cache") | The familiar suspect gets acquitted last | Evidence over expertise (`domains/evidence.md`) |
| D5 | Two bugs treated as one | The repro keeps "half-failing" and no fix explains it | Split the repro; two passes |

## Evidence-destruction tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| S1 | Swallowed exceptions (`catch {}`, `except: pass`) | The error is deleted before anyone reads it | Handle, translate, or propagate (`domains/errors.md`) |
| S2 | Log-and-swallow (`catch { console.log(err) }`) | The evidence is buried in a log nobody queries | Structured error with context; it must travel |
| S3 | Silent catch returns (`catch { return null }`) | Failure becomes indistinguishable from "no result" | Result types / rethrow with context |
| S4 | Debug markers shipped (`console.log("here")`, `debugger;`) | The crime scene left uncleaned; noise forever | `cleanup` before merge |
| S5 | Disabled code left behind (`if (false)`, commented-out blocks) | Ambiguity: is it coming back? is it load-bearing? | Delete — git remembers |

## Culture tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| C1 | Uncertainty markers without owners (`// hack`, `// why does this work?`) | The doubt is recorded and abandoned | Owner + ticket, or the doubt gets resolved |
| C2 | No regression pin after a fix | The bug will ship again — same input, same hole | `pin`: the exact repro as a test |
| C3 | No postmortem for production bugs | The class survives; the next instance is inevitable | `postmortem`: which gate would have caught it |
| C4 | Debugging in prod (print-debug shipped to production logs) | Noise for everyone, evidence for no one | Reproduce locally; structured logging if prod must speak |
| C5 | Blame instead of system | The person is fixed; the hole remains | The question is "what allowed it", never "who wrote it" |

## Detector mapping

`scripts/check.mjs` deterministically catches, with these rule ids: `swallowed-exception` (S1),
`log-and-swallow` (S2, JS single-line + windowed, Python windowed), `silent-catch-return` (S3),
`debug-marker` (S4, "here"-family + debugger), `disabled-code` (S5), `commented-out-debug` (S5),
`uncertainty-marker` (C1, comment lines — owner/ticket escape hatch). The rest are LLM-judged —
keep this file loaded when auditing or reviewing.
