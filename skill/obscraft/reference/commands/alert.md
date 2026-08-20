# Command: alert

Alert design: actionability, burn rates, and the fatigue budget (`domains/alerts.md` is the
authority). The pass that makes the pager trustworthy again.

## Steps

1. Inventory the alerts: conditions, severities, owners, runbooks, page volumes, and the flappers
   (from history).
2. Apply the actionability contract to each alert — every alert states its condition, the human
   action, a runbook link, and an owner (`signal-floor.md` #2). Alerts that fail the contract get
   rewritten or **deleted** — deletion is the expected outcome, not the exception.
3. Fix the firing shapes:
   - Single-sample pages → sustained thresholds or multi-window burn rates
     (`anti-patterns.md` A3).
   - Cause-only alerts → symptom alerts on the journey, with cause alerts demoted to tickets
     (`domains/alerts.md`).
   - Mean-based conditions → P95/P99 conditions (`signal-floor.md` #4).
4. Rebalance the fatigue budget: pages per shift become a designed number; every page gets its
   retrospective line (was the action possible? was it right?); repeat offenders are killed.
5. Move alerts to code (alerts-as-code in the repo) with versioned diffs and expiring silences
   (`domains/alerts.md` hygiene).
6. Verify: a synthetic fault fires the right alert, pages the right human, and the runbook's
   first step works.

## Exit criteria

- Every alert passes the contract or is deleted; burn-rate shapes in place; page volume within
  the budget; alerts versioned; the synthetic fault exercised end-to-end.

## Rules

- An alert whose action is "look at the dashboard" is noise — it gets deleted, not tuned.
- Killing pages is a feature: the goal is fewer, truer pages, and saying so in the changelog is
  part of the craft.
- Alert changes are reviewable diffs — hand-editing the alerting UI is unowned alerting.
