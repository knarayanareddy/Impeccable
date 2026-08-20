# Command: autom

Hunt and fix flaky pipeline steps — root cause, never retries (`domains/pipelines.md` is the
authority; `testcraft`'s determinism domain is the playbook). Flaky CI is a P1: it poisons the
team's belief in red, and the ignored red is the incident.

## Steps

1. Identify the suspects from run history: steps failing intermittently, retry counts, the
   "just re-run it" steps.
2. **Reproduce or stop.** Loop the suspect (re-trigger the job, or reproduce locally in the same
   container/runner shape). No reproduction, no fix — suspicion is not a fix.
3. Classify the cause against the flake taxonomy (`testcraft`'s determinism.md maps perfectly):
   - **Time** — wall-clock assumptions, expiring tokens mid-run.
   - **Order/parallelism** — steps sharing state, test-order dependence.
   - **Data** — shared fixtures, stateful services between runs.
   - **Cache** — stale cache keys serving old truth (`builds.md`).
   - **Resource** — runner contention, timeouts under load.
   - **External** — live third-party calls in the pipeline.
4. Fix at the root: fresh per-run state, content-addressed cache keys, faked external services,
   pinned versions, generous-but-honest timeouts.
5. Prove it: N consecutive green runs (10 is a floor) plus a randomized-order run where it
   applies. Zero flakes is the exit criterion.
6. Remove the stopgap: if a retry/mask was in place, delete it only after the proof run — and
   close the ticket (`ship-floor.md` #3).

## Rules

- Pipeline retries on test steps are a stopgap with a ticket, never a fix.
- Fix the pipeline's cause; if the cause is the *product* (a real race), that's a product bug —
  file it, pin the test, fix the product (`testcraft`'s harden agrees).
- A flaky deploy step is worse than a flaky test step: it fails in prod, not in CI.

## Exit criteria

- Root cause named, fix in place, proof run clean (10× + randomized order), stopgap removed,
  ticket closed.
