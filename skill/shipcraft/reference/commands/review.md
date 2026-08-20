# Command: review

Delivery-craft review with scoring — the judgment pass `audit`'s defect scan can't do alone. The
one question: **would you ship from this pipeline at 4:55 p.m. on a Friday?** No edits.

## Scorecard (1–5 each)

| Dimension | The question |
|---|---|
| Pipeline truth | Does green mean shippable — no masks, no notify-only gates (`pipelines.md`)? |
| Determinism | Same commit → same artifact, anywhere (`builds.md`)? |
| Environment parity | Do stage and prod tell the same truth (`environments.md`)? |
| Secrets | Referenced, scoped, never echoed or baked (`config.md`)? |
| Gate stack | Do the gates block and explain (`gates.md`)? |
| Deploy discipline | Strategies chosen, health checks real, deploys logged (`deploys.md`)? |
| Recovery | Is the rollback automated and rehearsed (`recovery.md`)? |
| Infra truth | IaC as source of truth, drift detected (`infra.md`)? |
| Observability | Deploy frequency, failure rate, MTTR measured (`monitor`)? |
| Boringness | Would a new engineer deploy on day one without heroics? |

## Steps

1. Read the delivery system as a new engineer shipping their first change would: from push, to
   gates, to deploy, to the moment it breaks. Note every stumble and every place they'd need a
   person.
2. Score each dimension with one "what's holding" and one "what's not" line, citing the exact
   step, file, or absence — "no revert path for the migration" is a citation.
3. Deliver: the scorecard, the three highest-leverage fixes (ranked by blast radius), one honest
   strength, and one "bold move" — the single change that would most de-risk shipping.

## Rules

- Review the system, not the team's courage: deploy fear is a finding about the pipeline, not
  the engineers.
- A masked red, an echoed secret, and an unrehearsed rollback are each full findings, not
  dimension nits.
- No edits in review; follow-up commands (`autom`, `rollback`, `env`, `gate`, `deploy`...) pick
  up the ranked list.
