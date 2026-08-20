# Command: slo

SLOs and error budgets from user journeys (`domains/slos.md` is the authority). The signature
command of this skill — this is where observability becomes a product decision.

## Steps

1. Pick the journey (from OBSERVABILITY.md or the request) and define its SLI with the product:
   - The good event ("checkout completes in < 3s with a usable result").
   - The bad events that count against it (5xx, slow-but-success, expected-4xx? — decide per
     SLI).
   - The measurement: event-based for multi-step journeys, request-based for single-step.
2. Set the SLO: target (99.9% to start — never 100%) and window (30d default, 7d where the team
   wants faster reaction).
3. Compute the error budget (1 − SLO over the window, in minutes) and make it visible: a burn
   panel on the journey's dashboard row.
4. Wire the burn-rate alerts (`domains/alerts.md`): fast burn (2% in 1h) pages; slow burn (5% in
   6h) tickets — the SLO's enforcement.
5. Assign the owner and the review cadence (weekly burn review) — an SLO with no owner and no
   review is a decoration (`anti-patterns.md` S4).
6. Verify: the SLI is measurable in the store; a synthetic failure moves the burn rate; the
   alert fires (and pages the right human).

## Exit criteria

- SLI + target + window + owner written and recorded; the budget visible and burning; the
  burn-rate alerts live and tested; the review cadence scheduled.

## Rules

- The SLI is a product decision — the good/bad definition gets the product's sign-off, never
  the engineer's assumption.
- Infrastructure SLIs don't substitute for journey SLIs (`anti-patterns.md` S2).
- 100% targets are rejected; the budget must be spendable or the SLO is fiction.
