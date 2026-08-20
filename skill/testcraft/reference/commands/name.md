# Command: name

Rename tests to state behavior-outcome-context. Test names are the suite's documentation index —
a red test's name is the first (and often only) thing the engineer reads.

## The naming pattern

```
[behavior] → [outcome] [context]
"rejects payment when the card is expired"
"returns the oldest open ticket for a team with multiple queues"
"emits order.created after a successful checkout"
```

- **Behavior** — what the system does (the verb + subject).
- **Outcome** — the observable result (the contract).
- **Context** — the condition that makes the case interesting (optional, only when it
  disambiguates).

## The rename targets

- Vague names: `should work`, `test 1`, `handles edge case`, `works as expected`, `basic test`.
- Grammar-vomit names that restate the code: `calls the fetchUser function and returns its
  result`.
- Implementation-coupled names that will lie after the next refactor: `uses the internal
  cache to skip the second query` (behavior: `returns cached results on the second call`).

## Rules

- The name is a claim: after any behavior change, re-read the names the change touched — a name
  that now lies is the first bug of the refactor (`suite-floor.md` Reflexes).
- Follow the codebase's convention (describe/it nesting, `test_...` style) — the pattern is the
  content, not the syntax.
- A name that can't be written (the behavior is too tangled to state) is a finding about the
  test — split it (`suite-floor.md` #2).

## Exit criteria

- Every touched test name states behavior → outcome (→ context); vague names gone from the
  target; names survive the lie-check.
