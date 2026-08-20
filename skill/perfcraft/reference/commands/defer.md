# Command: defer

Perceived performance: make the *user's* clock faster even where the wall clock barely moves
(`domains/web.md` is the authority). The highest-ROI performance work there is — the user can't
tell a 400ms server from a 400ms wait, but they can tell a skeleton from a spinner.

## The moves, in priority order

1. **Remove work from the critical path** — load only what the first paint needs; defer the rest
   (`defer`/`async` scripts, dynamic `import()`, non-critical CSS, below-the-fold lazy loading).
2. **Skeleton, not spinner** — for predictable loads, reserve the layout and fill it in. A
   skeleton preserves layout (no CLS) and makes the wait feel like progress
   (`anti-patterns.md` D4).
3. **Stream and progress** — stream HTML/data so content appears incrementally; real progress for
   genuinely slow operations (a percent or a named stage, not a spinner).
4. **Optimistic UI** — for predictable sub-second writes, apply locally, reconcile in the
   background, roll back visibly on failure.
5. **Feedback < 100ms** — press states, instant toggles, disabled-with-reason for what can't run
   yet. Perceived speed is feedback speed.
6. **Off-main-thread** — move heavy compute to workers so interactions stay responsive
   (`domains/concurrency.md`).

## Steps

1. Walk the target's load/interaction path as the user; list every perceptible wait and its
   cause.
2. Apply the cheapest move per wait (the list above is ordered); one surface per pass.
3. Verify with the user-clock metrics: INP, CLS, and the interaction-to-feedback times — quote
   before/after. LCP must not regress (lazy-loading the hero is the classic defer mistake:
   the LCP element is never lazy).

## Guardrails

- Defer changes *when* work happens, not *whether* — nothing gets dropped; a deferred job that
  never runs is a bug, not an optimization.
- Accessibility survives: content that appears late announces itself; reduced-motion respected
  (`criterion`'s motion domain agrees).

## Exit criteria

- Each wait addressed with a named move; user-clock metrics quoted before/after; nothing dropped,
  nothing regressed.
