# Domain: Units

The unit test is the workhorse of confidence. Its contract: deterministic, isolated, fast, and
coupled to behavior — never to implementation.

## Anatomy (Arrange · Act · Assert)

1. **Arrange** — build the world: realistic inputs, the dependency seams wired, the expected
   outcome computed *by hand* (never by re-running the code under test).
2. **Act** — one call to the public interface. If the behavior needs three calls to express, the
   test is an integration test or the API is wrong.
3. **Assert** — the observable outcome: the return value, the state change, the side effect, the
   error. Exact values or shapes (`domains/assertions.md`).

## The dependency rule

- Unit tests test **one unit in isolation**: dependencies are replaced at the boundary (a fake
  repository, a stub clock) — never the unit's internals mocked out.
- Pure logic: no doubles needed — the best kind.
- I/O at the edges: load at the top, persist at the bottom, pure logic in the middle
  (codecraft's `domains/functions.md` shape) — that middle is where unit tests live.

## Behavior coupling vs implementation coupling

- **Coupled to behavior:** the test pins inputs → outputs through the public interface. Refactor
  freely; the test never moves.
- **Coupled to implementation:** the test knows method names inside, call order of helpers, private
  state shapes. Every refactor breaks it — and the breaks mean nothing.
- The smell: a test that must change when the code changes *without* changing behavior. That test
  is testing the diff, not the contract.

## Local determinism

- No wall-clock, no randomness, no network, no filesystem, no environment variables, no singletons
  with memory. All of it injected or faked (`domains/determinism.md`).
- Every unit test runs: alone, in any order, in parallel, a hundred times. If not, it isn't a unit
  test.

## Table-driven tests

When one behavior has many cases (the boundary walk), use a table: cases as data, one test loop,
per-case names in the failure output. This is how you get fifty cases without fifty tests —
parameterization is not merging behaviors, it's organizing the same behavior's edges.

## Bans (recap)

Internal mocking, wall-clock dependence, network/filesystem access, tests that change when behavior
doesn't, one-test-per-line coverage theater, tests that can't run in parallel.
