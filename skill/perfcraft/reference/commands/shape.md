# Command: shape

Define the performance requirements before building: the budget per interaction and the critical
path. Performance shaped early is a feature; retrofitted, it's an incident.

## Steps

1. Restate the feature as interactions: what does the user do, and what must they perceive?
   ("Search results appear in under Xms for a typical query.")
2. Assign a budget per interaction from the product's requirements (or PERF.md's targets):
   - Browser: LCP/INP/CLS for the new surfaces (`domains/web.md`).
   - Backend: P95 latency for each new request path, and its dependency slices
     (`domains/latency.md`).
3. Walk the critical path and name the costs: which dependencies, queries, and payloads sit on it
   — and their expected contribution to the budget.
4. Decide the shape choices that carry performance: pagination strategy, caching layer, batching,
   async boundaries, code-splitting, image strategy (`domains/delivery.md`).
5. State the risks: unbounded data, N+1 traps, sync I/O, main-thread work — and which are designed
   out vs accepted with a reason.
6. Deliver: the interaction table (interaction | budget | critical path | risks) and wait for
   approval before building.

## Rules

- Shape never edits code. It ends where implementation begins.
- Every budget names its percentile and measurement environment — a budget without a percentile is
  a wish.
- If the feature can't meet the budget by design, that's a shape finding: say so now, negotiate
  the budget or the scope — never discover it in production.
