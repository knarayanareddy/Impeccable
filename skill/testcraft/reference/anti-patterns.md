# Anti-patterns: the test-slop tells

The fingerprints of a test suite written by an agent (or a team) gaming the green bar instead of
earning it. Each is a defect — a green lie, a flake factory, or a maintenance tax. Most have a
deterministic rule in `scripts/check.mjs`; the rest are LLM-judged with this file loaded.

## Honesty tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| H1 | Focused tests left in (`.only`, `fit`, `fdescribe`) | CI runs one test while the rest rot silently | Delete before merge; CI blocks on it |
| H2 | Skipped tests accumulating (`.skip`, `xit`, `todo`) | Dead promises; the suite shrinks in secret | Reason + owner + tracker, or `prune` |
| H3 | Empty tests (`it("x", () => {})`, `def test_x(): pass`) | Green with zero meaning | Write the contract or delete the test |
| H4 | Tautological assertions (`expect(true).toBe(true)`) | Can never fail — the definition of a lie | Assert the actual behavior |
| H5 | Asserting nothing observable (`expect(fn).not.toThrow()` as the whole test, existence-only checks) | Green says "it didn't explode", not "it works" | Pin the outcome: value, state, side effect |

## Weakness tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| W1 | `toBeTruthy`/`toBeDefined` as the final answer | Passes for the wrong value | Assert the exact value or shape |
| W2 | Snapshot sprawl (snapshots for everything, never reviewed) | A change-diff becomes a rubber stamp; snapshots are updated, not read | Snapshots only for stable shapes; review every diff |
| W3 | Asserting implementation details (`expect(spy).toHaveBeenCalledWith(internalArg)`) | Refactors break tests with zero behavior change | Assert outcomes through the public interface |
| W4 | Testing the mock, not the code (mock returning the expected value, then asserting it) | The test proves the mock works | Fakes only at the boundary; verify real behavior elsewhere |
| W5 | One assertion per test as dogma producing test soup | Five tiny tests re-running the same setup cost more than one well-named multi-assert scenario | One *behavior* per test; multiple assertions per behavior are fine |

## Flakiness tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| F1 | `sleep(500)` / `waitForTimeout` as synchronization | A race with a delay; slow *and* flaky | `waitFor`-with-timeout on a state predicate, or fake timers |
| F2 | Unseeded `Math.random()` in tests | Nondeterministic inputs; the flake that hides | Seed it, or inject the randomness |
| F3 | Real wall-clock time (`new Date()` assumed, "created 2 minutes ago" logic) | Fails at midnight, on DST, on slow CI | Fake timers or inject the clock |
| F4 | Retry masks (`jest.retryTimes`, `@flaky`, pytest-rerun) | The flake still exists — now it's a slow flake | Fix the root cause; retries are a stopgap with a ticket, not a fix |
| F5 | Tests depending on execution order / shared mutable state | One test's leftovers become the next test's input | `isolate`: fresh fixtures per test, no shared DB/files/globals |

## Level tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| L1 | E2E tests for what units cover | Minutes spent re-proving the trivial; suite duration explodes | Move the contract to the cheapest level that can prove it |
| L2 | Unit tests with real network calls | The "unit" test is an integration test with unit-test expectations | Mock the boundary, or rename the level honestly |
| L3 | The ice-cream cone (E2E-heavy, unit-starved) | Slow feedback, vague failures, expensive flake | Rebalance toward units; keep a thin E2E slice |
| L4 | No integration tests at all (units + E2E only) | The seams (DB, API, serialization) are untested — exactly where bugs live | Real-seam integration tests with containers/local services |
| L5 | Coverage chased to 100% | The last 20% costs more than it protects, and gets gamed | `cover` risk-ranked areas; mutation testing over number-chasing |

## Maintainability tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| M1 | Vague names (`should work`, `test 1`, `handles edge case`) | Failures say nothing; the suite becomes unreadable | behavior-outcome-context naming (`name`) |
| M2 | Copy-paste test code with one changed value | Divergence breeds green lies | Parameterize (table-driven tests) or share builders |
| M3 | Fixtures disconnected from production shapes | Tests green against data that can't exist | Refresh fixtures; generate from production schemas |
| M4 | Tests of removed behavior kept "just in case" | Rot; readers can't tell contract from museum | `prune` — git remembers the old test |
| M5 | Clever shared test helpers (DRY-above-readability) | The helper's abstraction becomes the thing being tested | Readable repetition beats clever helpers in tests |

## Detector mapping

`scripts/check.mjs` deterministically catches: H1 (focused), H2 (skipped), H3 (empty tests incl.
`def test_x(): pass`), H4 (tautological assertions), F1 (sleeps), F2 (unseeded randomness), F4
(retry masks), L2 (network in test files), H5-ish (files with tests but zero assertions). The rest
are LLM-judged — keep this file loaded when auditing or reviewing.
