# Command: repro

Make the failure happen on demand — the signature command of this skill (`domains/reproduction.md`
is the authority). Until it reproduces, it's a suspicion; after, it's a bug you can catch.

## Steps

1. Capture the original scene before anything changes: exact inputs, data, config, environment,
   and the exact error (`domains/evidence.md` — the scene is evidence).
2. Replay faithfully: same version, same data, same environment parity (or the parity gap
   stated — a repro on the wrong version is a different bug).
3. Pin the nondeterminism: seed the randomness, fake the clock, fix the order, single-thread the
   concurrency (`testcraft`'s determinism domain is the playbook). A repro that fails 1-in-10 is
   not a repro yet.
4. Encode the repro as an artifact: a script, a test, or a runbook — one command for the next
   engineer. If the bug lives in a specific runtime, load its sheet in
   `reference/environments/` first (browser-javascript, python-services,
   distributed-systems).
5. If it won't reproduce: instrument (targeted structured logging at the suspected boundary),
   capture the environment diff, and replay history/data — but **never fix blind**
   (`evidence-floor.md` #1). The honest artifact is the instrumentation + the ticket.

## Exit criteria

- The bug fails on demand (deterministically, or with the window documented); the repro
  artifact committed; or the can't-reproduce protocol shipped with instrumentation in place.
- The bug record holds the floor: `node <skill-dir>/scripts/repro-check.mjs --bugs <records>`
  passes (the quartet + the rung — `reference/commands/repro-check.md`).

## Rules

- Reproduce before you theorize: candidates come after the repro, not before it (`shape`'s
  discipline).
- The repro's determinism is the downstream guarantee — bisect, minimize, and fix all trust it.
- Never mutate the scene to "help" the repro — the edit that hides the bug is evidence
  destruction.
