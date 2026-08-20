# Suite floor

Load this file **immediately before editing any test**. It is the non-negotiable floor, the absolute
bans, and the reflexes no detector catches. When the team's published test conventions are stricter,
theirs win.

## The floor

1. **Every test asserts a contract.** A test with no assertion, or an assertion that can never fail,
   is a lie wearing a test's clothes. Each test's name + assertion pin one observable behavior.
2. **One test, one behavior.** Tests test one thing each. A test that walks three scenarios is three
   tests — split them; the failure message of the merged version names none of them.
3. **Deterministic by construction.** No wall-clock time, no unseeded randomness, no external
   network in unit tests, no dependence on execution order, no shared mutable state. A test that
   can't run in any order, any number of times, alone, is broken.
4. **No sleeps as synchronization.** Polling/`waitFor` with a timeout, or fake timers. `sleep(500)`
   is a flake with a latency cost (`domains/determinism.md`).
5. **Focused tests never merge.** `.only` / `fit` / `fdescribe` in the repo means CI runs one test
   while the rest silently rot — a commit blocker, enforced by CI, not by memory.
6. **Skipped tests are debt, tracked.** Every `.skip` / `xit` / `todo` names why it's skipped and
   where it's tracked; skipped tests have an owner and a plan, or they get deleted (`prune`).
7. **Behavior over implementation.** Tests assert outcomes through public interfaces, not internals.
   A refactor that preserves behavior must not touch a test (`domains/units.md`).
8. **Failures diagnose themselves.** Name + assertion + message should identify the broken contract
   without opening the test body. Vague names and weak assertions fail this floor item.
9. **Fast by level.** Unit tests milliseconds, integration seconds, E2E minutes — and each test at
   the cheapest level that can prove its contract (`domains/e2e.md`).
10. **Flakiness is a defect with a root cause.** Any flaky test gets fixed at its cause (time,
    order, async, data) — never masked with retries (`domains/determinism.md`).

## Absolute bans (deterministic — most are caught by `scripts/check.mjs`)

- Focused tests in the repo: `.only`, `fit(`, `fdescribe(`, `fcontext(`
- Silently accumulating skips: `.skip`, `xit(`, `xdescribe(`, `todo(` without a reason
- Sleeps as synchronization: `sleep(`, `waitForTimeout(`, `Thread.sleep`, `time.sleep`, `cy.wait(N)`
- Unseeded randomness in tests (`Math.random()` without a seed)
- Retry masks: `jest.retryTimes`, `@pytest.mark.flaky`, `@retry`, `@flaky`
- Tautological assertions: `expect(true).toBe(true)`, `assert true`, `assertEqual(1, 1)`
- Empty tests: `it("x", () => {})`, `def test_x(): pass`
- Direct network calls in unit-test files
- Test files with test definitions but zero assertions

## Reflexes (no detector catches these)

- **The green-lie test.** Ask of every green suite: if the product broke here, would any test go
  red? If not, the green is a rumor.
- **The red-usefulness test.** Ask of every red: does it tell the engineer what contract broke? If
  they must open the test body to find out, the test has failed its job.
- **The mutation test.** Flip one line of behavior in your head — does a test fail? The best suites
  fail the mutation test per behavior; the worst fail it per file.
- **Tests are read, not just run.** The suite is documentation that happens to execute. Write it
  for the next reader.
- **The slowest test is the tax.** Suite duration is a daily cost paid by every engineer, every
  commit. A test that costs minutes must earn minutes.
- **A bug found in production is a missing test.** Every production bug gets a regression test in
  the same fix — the bug-pinning test is the only proof it can't come back.
- **Fixtures rot faster than code.** Test data that no longer represents production is a green lie.
  Refresh fixtures deliberately (`domains/determinism.md`).
