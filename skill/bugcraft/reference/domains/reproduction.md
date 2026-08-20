# Domain: Reproduction

Reproduction is the moment a suspicion becomes a bug. The rule: **the bug doesn't exist until it
fails on demand** — and the repro is an artifact, not an anecdote.

## The reproduction protocol (`repro` implements this)

1. **Capture the original state.** The exact inputs, data, config, environment, and the exact
   error — *before* anything is changed. The scene is evidence (`domains/evidence.md`).
2. **Replay faithfully.** Same data, same version, same environment (or as close as the parity
   allows — `shipcraft`'s environments domain is the authority on parity). A repro on a
   different version is a different bug.
3. **Make it deterministic.** Identify the nondeterminism (time, randomness, order, concurrency)
   and pin it: fixed seed, fixed clock, fixed order, single-threaded. A repro that fails 1 in 10
   is a flake, not a repro yet (`testcraft`'s determinism domain is the playbook).
4. **Encode the repro as an artifact** — a script, a test, or a runbook — so the next engineer
   runs it in one command instead of re-discovering it.

## The "can't reproduce" protocol

Can't-reproduce is a state of evidence, not a dead end:
- **Instrument, don't speculate** — add targeted logging/telemetry at the suspected boundary and
  ship it (structured, cheap — `obscraft`'s logs domain). The next occurrence is captured.
- **Capture the environment** — the failing machine's versions, config, and state (a diff
  against yours often *is* the cause: the "works on my machine" bug is an environment bug).
- **Replay the history** — if the bug appeared recently, `bisect` the commits; if it's
  data-dependent, replay production data in a scratch environment.
- **Never fix blind.** A patch shipped without a repro is a guess in production clothing
  (`evidence-floor.md` #1). The honest artifact is the instrumentation + the ticket.

## The kinds of reproduction

- **Deterministic repro** — the gold standard: one command, always fails.
- **Seeded repro** — deterministic once the seed/clock is pinned.
- **Windowed repro** — reproduces only under conditions (specific data shape, load level);
  the window is part of the artifact's documentation.
- **Heisenbugs** — fail under observation, vanish under debuggers: the observation itself
  changes timing. Fix by *removing* observation (log, don't break) and pinning the timing
  assumptions.

## Bans (recap)

Fixing before reproducing, repros on the wrong version, un-pinned nondeterminism, anecdotes as
repros, blind patches, observation that changes the bug unacknowledged.
