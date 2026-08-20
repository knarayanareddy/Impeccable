# Domain: E2E

End-to-end tests prove the product works from a user's seat. They are expensive, slow, and
irreplaceable — so they are few, deliberate, and read like user journeys.

## What belongs here (and only here)

- The **critical journeys**: signup → first value → core loop; pay → receive; deploy → observe.
  The paths where a failure is a business incident.
- **Cross-system truth**: browser + API + DB + queue acting as one. Anything a single seam can
  prove belongs lower (`domains/integration.md`).
- The **thin slice**: 5–20 journeys, not 200. Every E2E must name the incident it prevents.

## The rules

- **Journeys over screens.** Each test is a story with steps ("a new user signs up, imports data,
  sees the summary") — not per-page assertions.
- **Test data strategy:** fresh, known data per run (seeded users, deterministic IDs); never depend
  on pre-existing state; never run against shared environments where parallel runs collide.
- **Selectors are a contract:** `data-testid` (or the equivalent) for hooks — never CSS classes
  that restyle, never text that rewords, never fragile DOM paths. UI refactors must not break E2E.
- **Wait for state, not time** (`domains/determinism.md`): wait on the observable ("the row
  appears", "the toast dismisses") with a timeout — never `sleep(500)`.
- **Assert the user-visible truth:** what the user sees and can do. The E2E that asserts a 200 and
  an empty div proves nothing.

## The cost budget

- E2E runs in CI on every merge (or a nightly full run with a smoke slice per PR) — the slice is
  the negotiation: smoke (2 min) per PR, full (15 min) nightly.
- One flaky E2E poisons the suite's credibility faster than ten flaky units — E2E flakiness is a
  P1 (`flaky`).
- Screenshots/videos on failure: the E2E's failure message is a recording.

## Bans (recap)

E2E-for-what-units-cover, brittle selectors, sleep-based waits, shared-state dependence,
per-page assertion theater, E2E sprawl without named incidents.
