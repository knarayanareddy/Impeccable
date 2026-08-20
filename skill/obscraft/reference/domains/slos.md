# Domain: SLOs

SLOs turn "working" from a feeling into a number with consequences. The craft: the SLI measures
what users feel, the target is achievable-but-demanding, and the error budget is a *spent*
currency, not a decoration. The differentiator's sibling — this is where observability becomes
product management.

## The anatomy

- **SLI** (indicator): the measured truth. Good SLIs are user-shaped: "proportion of checkouts
  completing in < 3s", "proportion of API requests with 2xx/expected-4xx within budget".
- **SLO** (objective): SLI ≥ target over a window: "99.9% of checkouts < 3s over 30 days".
- **Error budget**: 1 − SLO = the failure you're *allowed*. 99.9%/30d ≈ 43 minutes of bad
  checkout per month — a number the team can spend on purpose.
- **SLA** (agreement): the customer-facing promise with consequences — derived from the SLO, with
  margin. Never the starting point.

## Writing good SLIs (the hard part)

- **From the journey, not the infrastructure** (`anti-patterns.md` S2): "user can pay" beats "CPU
  available". Server metrics are *evidence*, the journey is the *answer*.
- **Event-based, not request-based, for multi-step journeys**: a checkout touching four services
  is one event with an outcome — per-service request SLIs would each report green while the
  journey is broken.
- **Good vs bad is a product decision**: which failures count against the budget (5xx? slow-but-
  success? a 409 that's the user's fault?) — written down per SLI.
- **A few, not many**: 2–5 SLIs per product surface. Every additional SLO is an additional
  argument to have at 3 a.m.

## The error budget is the product

- **Burn rate is the health signal** (`domains/alerts.md`): 2% of the budget burned in an hour =
  something broke; 10% in a day = emergency. The burn rate alerts *are* the SLO's enforcement.
- **Spend the budget deliberately**: a risky deploy is a budget spend with a rollback trigger
  ("if we burn 5% in 2 hours, roll back"). That's the SLO doing its real job — turning
  reliability into an engineering decision.
- **Review weekly** (`anti-patterns.md` S4): the burn review is where the budget gets spent,
  replenished, and argued about. An error budget nobody reviews is a decoration.

## Targets that mean something

- **Never 100%** (`anti-patterns.md` S3) — unachievable targets produce unspendable budgets and
  ignored SLOs. Start at 99.9% (or where the users' patience actually is), tighten with evidence.
- The window matters: 30 days smooths, 7 days reacts. Pick the window the team actually wants to
  react on.
- **SLOs need owners** — one person per journey who answers for the number and negotiates the
  budget.

## Bans (recap)

No SLOs, infrastructure SLIs, 100% targets, per-service SLIs for multi-service journeys,
unspent budgets, unowned SLOs, undefined good/bad.
