# Framework sheet: Jest / Vitest

Loaded with the relevant domains when the framework is Jest or Vitest. The framework-native
specifics; the compass domains still hold.

## Structure conventions

- `describe`/`it` with behavior→outcome→context names (`name`'s pattern); `it.each` tables for
  the boundary walk (`domains/units.md`'s table-driven rule).
- `beforeEach` owns fresh fixtures; `afterEach` restores fakes — never cross-test state in
  module scope (`domains/determinism.md`'s isolation rule).

## Determinism APIs (the flake-fighters)

- **Fake timers** for anything scheduled: `jest.useFakeTimers()` / `vi.useFakeTimers()` with
  `advanceTimersByTime` — never `setTimeout` races (`anti-patterns.md` F1).
- **`jest.setSystemTime` / `vi.setSystemTime`** for wall-clock assumptions; inject the clock
  into the code under test where the API allows (`domains/determinism.md`'s time row).
- **Seeded randomness**: `vi.spyOn(Math, "random").mockReturnValue(0.42)` or inject the RNG —
  never unseeded (`anti-patterns.md` F2).
- **Isolation flags**: `--runInBand` when shared state must be found (a diagnostic, not a
  lifestyle — `isolate` fixes the state, the flag only proves it).

## Mocks (the framework's trap)

- `jest.fn()` at the boundary only (`domains/fakes.md`); `jest.mock` of third parties goes
  behind an adapter; never mock the unit's own internals.
- `expect(mock).toHaveBeenCalledWith` is the interaction tax — paid sparingly, at the seam.

## The bans to enforce in CI

- `.only` (block via eslint-plugin-jest's `no-focused-tests`), unexplained `.skip`
  (`no-disabled-tests`), `jest.retryTimes` on tests (`no-test-retries`-style policy — retries
  are the mask, not the fix).
- `expect(x).toBeTruthy()` as the final assertion (`domains/assertions.md`'s strength ladder).

## Bans

Focused/skipped debt, fake-timer-free scheduled code, unseeded randomness, internals mocking,
retry masks, truthiness finals.
