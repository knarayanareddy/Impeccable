# Domain: Integration

Integration tests own the seams — where your code meets the database, the HTTP layer, the
serializer, the queue. This is where most real bugs live, and where the classic pyramid skips a
level.

## What belongs here

- **Database seams:** real engine (container or local instance), real migrations, real constraints.
  Your code against the actual SQL dialect — not an in-memory substitute that agrees with you.
- **HTTP/API seams:** the real router + handlers over the wire (supertest, httpx against the
  running app), real serialization, real status codes.
- **Serialization/contracts:** payloads round-tripping through the real codec; schema validation.
- **External-service seams:** a fake or recorded version of the third party (WireMock, recorded
  cassettes) — real enough to catch contract drift, fake enough to stay deterministic.

## The rules

- **One real seam per test** where possible: the DB test doesn't also need the real queue and the
  real clock. Real seams compose badly — isolate which seam is under test.
- **Real data shapes:** fixtures that mirror production (types, sizes, weird values) — a seam test
  with toy data proves the seam works with toys.
- **Setup is cheap and truthful:** migrations run, fixtures load, the seam tears down per test or
  per suite with transactions/truncation. A seam test that needs 30s of setup will be skipped.
- **Assertions at the boundary:** status codes, persisted rows, emitted events — the contract
  across the seam (`domains/assertions.md`).
- **Contract tests for consumers:** when the API has consumers, pin the response contract
  (shape + semantics) — the seam is a promise, test the promise (`apicraft`'s spirit).

## Integration vs unit vs E2E (the honest split)

- Unit: pure logic, isolated. Fast, many.
- Integration: one real seam at a time. Seconds, focused.
- E2E: the whole system, user journeys. Minutes, few (`domains/e2e.md`).
A test that drags three real seams into "unit" clothing is a slow, flaky lie — call it what it is
and put it where it belongs.

## Bans (recap)

In-memory substitutes for the real seam when the dialect matters, toy data, seams composed into
unholy stacks, boundary assertions missing, contract drift untested.
