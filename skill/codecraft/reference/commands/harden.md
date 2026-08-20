# Command: harden

Error handling, invariants, and edge cases — make the failure paths as deliberate as the happy path
(`domains/errors.md` is the authority). This is where silent production bugs are born or prevented.

## Steps

1. Enumerate the failure surface of the target: every I/O, every external call, every parse, every
   boundary of trust, every function with preconditions.
2. For each, verify or implement per the error model:
   - **Errors handled, not swallowed** — each catch/except does one of: recover / translate with
     context / report-and-continue with a why-comment / propagate by design.
   - **Validation at the edges** — inputs checked where they enter, with precise errors.
   - **Invariants asserted** — what must be true is checked where it's established.
   - **No magic-value failures** — no `-1`/`null`-as-error without an explicit contract.
3. Walk the edge-case list systematically: empty input, zero/negative/large values, nil/null,
   duplicate keys, concurrent access, timeouts, partial failure, Unicode/encoding, timezones.
   Every case gets triaged: handled / accepted-with-reason / deferred (recorded).
4. Verify error *messages*: operation + subject + fix, written for the caller (`errors.md`).
5. Check cleanup paths: resources released on every exit (`defer`/`finally`/context managers), no
   leaks on the error branches.

## Exit criteria

- No silent failure path in the target; every catch does one of the four things.
- The edge-case sweep recorded with a triage per case.
- Tests (or recorded evidence) cover at least the failure paths the change touched.

## Rules

- Harden adds guards and handling; it doesn't redesign or add features.
- A visible, actionable failure beats a silent retry — but a real retry with backoff beats a visible
  failure for transient errors. Choose per case and say why.
- Don't harden code you don't understand: if the error model is unclear, `review` it first.
