# Domain: Tooling

Tools multiply the debugger, but never replace the discipline — a debugger in the hands of a
guesser produces faster guesses. The craft: the right instrument per question, and the evidence
recorded.

## The instrument table

| Question | The instrument |
|---|---|
| Where does this code path go wrong? | Debugger / breakpoints — step the truth, don't print it |
| When did it start failing? | git bisect (`domains/bisection.md`) |
| Where does the time go (is it stuck, or slow)? | Profiler / flame graph (`perfcraft`'s measurement domain) |
| Which service diverged? | Distributed traces (`obscraft`'s traces domain — `trace` walks them) |
| What was the state at failure? | Core dumps / heap snapshots / error reports (Sentry-style) |
| What does this expression do here? | REPL / scratch file — the 30-second question |
| Which change broke it? | The deploy log, the diff (`shipcraft`'s monitor) |

## The rules

- **Breakpoints over prints** — a breakpoint inspects without editing; a print edits the scene
  and must be cleaned (`cleanup`). Prints are for when the debugger can't attach (prod-lite,
  embedded) — and then they're structured, leveled, and temporary (`obscraft`'s logs domain).
- **The tool's output is evidence, recorded** — the trace, the profile, the core dump get cited
  (and linked) in the diagnosis (`domains/evidence.md`). An uncited tool run is a vibe.
- **Observation must not change the bug** — heisenbugs: prefer logging/tracing over breakpoints
  when timing is the suspect (`domains/reproduction.md`).
- **Reproduce locally before remote tools** — the fastest debugger is the repro; production
  debugging is the last resort and gets the lightest touch (`evidence-floor.md` #6's sibling).

## Debugging in production (when you must)

- Read-only: traces, logs, metrics — never a mutating experiment.
- The experiment is a hypothesis with a prediction, run at minimum blast radius (one user,
  one instance, feature-flagged).
- Everything learned in prod is captured into a local repro before the fix (`domains/
  reproduction.md`) — production is where you *see* the bug, the laptop is where you *catch* it.

## Bans (recap)

Print-debugging as the default, uncited tool output, breakpoints on timing bugs, mutating
production experiments, prod-only understanding without a local repro.
