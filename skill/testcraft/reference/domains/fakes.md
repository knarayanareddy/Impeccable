# Domain: Fakes

Test doubles (fakes, stubs, mocks, spies) are where unit tests meet the world. The discipline:
double only the boundary, verify behavior through it, and never let the double become the test.

## The preference order

1. **The real thing** — if it's fast, deterministic, and side-effect-free, use it. The best double
   is none.
2. **A fake** — a working in-memory implementation (an in-memory repository, a stub clock). Real
   behavior, controlled environment. The workhorse.
3. **A stub** — returns canned responses for the inputs the test cares about. Good for edges and
   errors ("the payment API is down").
4. **A mock** — asserts interactions (call counts, arguments). The last resort: it couples the test
   to *how*, not *what*.

## The rules

- **Mock the boundary, not the collaborator.** Mock the interface your unit depends on — never
  mock what you don't own (the framework's internals, the ORM's guts). Wrap third-party calls in a
  thin adapter; mock the adapter.
- **The double is for input, the assert is for outcome.** Arrange with the double; assert on the
  unit's output and state. A test whose assertions are all on the mock ("expect(save).toHaveBeen
  CalledWith(...)") is testing the mock.
- **Fakes must behave.** An in-memory repository that doesn't enforce uniqueness is a fake that
  lies. The fake needs enough of the real contract to make tests meaningful — and it gets its own
  tests.
- **One seam per concern.** Doubling time, randomness, and storage through one seam each keeps
  tests readable (`domains/determinism.md`).

## Mocking frameworks: the two families

- **Verification mocks** (jest.fn, Mockito, unittest.mock): post-assert interactions. Use
  sparingly — interaction assertions are the most brittle kind.
- **Behavior fakes** (hand-rolled): pre-wired behavior. Prefer these; they read like code, not
  like bookkeeping.

## The smells

- Mock returning the value that's then asserted (the circular test).
- Mocking everything — the unit under test becomes the only real thing, proving nothing about
  integration.
- `verifyNoMoreInteractions` — the test now pins every incidental call forever.
- Deep chains (`mock().a().b().c()`) — the code has a design problem the test is exposing.

## Bans (recap)

Mocking internals, mocking third parties without an adapter, assert-on-mock-only tests, lying
fakes, circular mock/assert, over-verification.
