# Domain: Cases

The test-case inventory is where testing starts: deciding *what* deserves a test, before deciding
how. Most gaps are not missing test code — they're missing cases.

## The case inventory (per behavior)

For each behavior in scope, walk the dimensions:

1. **Happy path** — the primary case, with realistic (not minimal) inputs. The test that documents
   what the feature is *for*.
2. **Boundaries** — zero, one, max-1, max, max+1; empty string, one char, length limits; min/max
   numbers, the exact threshold. The bugs live at the edges.
3. **Error paths** — invalid input, missing dependency, failed I/O, timeout, permission denied.
   What the system *must not* do matters as much as what it must.
4. **States** — the lifecycle: pending → active → done; empty, loaded, failed. Every transition
   that matters, and the forbidden transitions.
5. **Concurrency** — two writers, read-during-write, duplicate submit, retry after partial success.
   Only when the behavior is concurrent by nature.
6. **The regression pin** — every production bug becomes one case: the exact input that broke it,
   with a comment linking the bug.

## Prioritization

- Rank by (frequency × impact × risk of regression). The 10×-a-day path with money on it gets
  exhaustive cases; the once-a-year internal flag gets a smoke test.
- New code: cases from the spec, written before or with the code (`shape`).
- Existing code: cases from the *observable* contract — what callers rely on — not from the
  internals.

## The case table (`shape` outputs this)

| Case | Input | Expected outcome | Level | Why it matters |
|---|---|---|---|---|
| ... | ... | ... | unit/integration/e2e | ... |

Rules:
- Every case states the expected *observable* outcome — a value, a state change, an effect, an
  error. "It doesn't crash" is not an outcome.
- Level assignment: the cheapest level that can prove the case (`domains/e2e.md`).
- Empty categories are findings: a behavior with no boundary cases is under-tested; a behavior with
  no error cases is un-tested on its riskiest half.

## Bans (recap)

Happy-path-only coverage, boundary blindness, error paths left to production, cases copied from
implementation instead of contract, "should not crash" as an expected outcome.
