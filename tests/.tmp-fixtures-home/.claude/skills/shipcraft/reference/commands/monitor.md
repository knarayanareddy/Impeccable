# Command: monitor

Deploy observability: DORA metrics, deploy logs, and smoke tests (`domains/deploys.md` is the
authority; `obscraft`'s telemetry doctrine is the philosophy). The pass that makes the delivery
system answerable — who shipped what, when, and did it break.

## Steps

1. Map what's visible today: deploy logs, pipeline run history, health signals per environment,
   and the DORA-shaped metrics — the gaps are the work.
2. Fill the metric set:
   - **Delivery**: deploy frequency, lead time (commit → prod), change failure rate, MTTR
     (DORA) — the delivery system's health report, reviewed monthly.
   - **Pipeline**: run duration, pass rate, flake rate, queue wait (`measure` shares these).
   - **Deploy events**: a log per deploy — artifact digest, config delta, strategy, approver,
     health before/after (`domains/deploys.md` #6).
   - **Environment truth**: drift findings, parity-check pass rate (`env`'s detection feeds
     here).
3. Wire the post-deploy smoke tests: journey-level checks that gate the rollout's success and
   arm the rollback trigger (`domains/recovery.md`).
4. Alert on the delivery signals: flake-rate spikes (the pipeline is sick), drift detection
   (reality diverged), failed-deploy rates — with owners (`obscraft`'s alerts domain is the
   authority on actionability).
5. Verify: a synthetic deploy produces a complete log entry; the metrics render; a synthetic
   failure fires the right alert.

## Exit criteria

- DORA metrics measured; every deploy logged with the full event; smoke tests gating rollouts;
  the delivery alerts owned and tested.

## Rules

- Monitor measures the delivery; it doesn't fix it (`autom`/`rollback`/`env`'s scope).
- The deploy log answers the 2 a.m. question — "what changed?" — without archaeology. If it
  can't, that's the finding.
- Delivery metrics reviewed monthly, or they're decoration (`measure`'s sibling rule).
