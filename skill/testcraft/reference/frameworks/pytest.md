# Framework sheet: pytest

Loaded with the relevant domains when the framework is pytest. The framework-native specifics;
the compass domains still hold.

## Structure conventions

- `test_*.py` files, `test_*` functions with behavior→outcome→context names (`name`'s pattern);
  classes only for shared fixture groups (`class TestCheckout:`), never for organization's sake.
- **Fixtures over setup methods**: `@pytest.fixture` with explicit scopes (`function` default —
  fresh per test, `module` only where the cost is measured and the state is documented);
  fixture teardown via `yield` (`domains/determinism.md`'s isolation rule).

## Determinism APIs (the flake-fighters)

- **Parametrize for the boundary walk**: `@pytest.mark.parametrize("count,expected", [...])` —
  the table-driven rule, natively (`domains/units.md`).
- **Freezegun-style clock control** for wall-clock code: `freezegun.freeze_time(...)` or inject
  the clock — never real `datetime.now()` assumptions (`anti-patterns.md` F3).
- **Seeded RNG**: seed per test or monkeypatch `random` — never unseeded
  (`anti-patterns.md` F2).
- **`tmp_path` for files**: per-test temp dirs from the fixture — never shared scratch paths
  (`anti-patterns.md` F5).

## Marks & plugins (the trap)

- `@pytest.mark.flaky` / rerun plugins are the retry mask — a stopgap with a ticket, never a
  fix (`anti-patterns.md` F4, `flaky`'s doctrine).
- `@pytest.mark.skip` carries a reason or it's skip debt (`suite-floor.md` #6); `-m` filters in
  CI are documented, not silent.
- `monkeypatch` for environment and global state — with the patch scoped to the test
  (`isolate`'s no-globals rule).

## The bans to enforce in CI

- `assert True` / `assertEqual(a, a)` / `assert False` (`anti-patterns.md` H4 — the checker
  flags them); bare `except: pass` (`bugcraft`'s class); `time.sleep` as sync
  (`anti-patterns.md` F1); `print()` debug shipped.

## Bans

Flaky-marks, reason-less skips, unseeded randomness, shared temp paths, tz-naive time
assumptions, tautological asserts, sleep-as-sync.
