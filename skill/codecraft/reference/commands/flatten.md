# Command: flatten

Cut nesting depth with guard clauses and early returns. The cheapest readability win in existence:
you delete indentation and the reader deletes mental stack.

## Steps

1. Identify the deep region: the function with depth 3–5+ (the checker flags indentation ≥ 5 levels).
2. Convert preconditions to guard clauses at the top:

```python
# before
def ship(order):
    if order:
        if order.is_paid():
            ...

# after
def ship(order):
    if not order:
        return
    if not order.is_paid():
        return
    ...
```

3. Invert deep `if/else` chains — put the failure/early path first, the happy path straight down.
4. Extract loop bodies and nested conditionals that read as sub-jobs (`extract`) — a nested block
   that needs a sentence to explain is a function waiting for a name.
5. Watch for the side effects the guards must preserve: cleanup (`defer`/`finally`), early returns
   of *values*, logging — flattening changes control flow, so the contract (step 1 of every pass)
   must list each exit path explicitly.
6. Verify: run tests/types, check.mjs, and re-read the happy path top to bottom — it should now read
   as a sequence of statements, not a tree.

## Guardrails

- Depth 3 with a good reason is fine; flattening is not a crusade to depth 1.
- Never flatten by introducing new flags ("did we return early?") — that trades depth for state,
   a worse deal.
- Preserve error behavior exactly: an early `return` where the code used to fall through changes
   the caller's world.

## Exit criteria

- Max depth reported before and after (e.g., "6 → 3"); happy path reads as straight-line steps;
  tests green.
