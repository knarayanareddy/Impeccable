# Command: monitor

Wiring: collectors, exporters, storage, retention (`domains/telemetry.md` is the authority). The
infrastructure half of observability — the signals are useless if the pipeline drops, delays, or
spills them.

## Steps

1. Map the pipeline end to end: emission → collection → transport → storage → query — and each
   hop's failure mode (what happens when the collector dies? the store fills?).
2. Fix per hop:
   - **Collection** — exporters/collectors configured with backpressure (drop-oldest vs block —
   a written choice), and the telemetry pipeline's own health monitored (the monitor is
     monitored).
   - **Storage** — retention tiers per data class (hot days / warm weeks / cold compliance),
     cardinality limits enforced at ingest, quotas with owners.
   - **Query** — the on-call query path is fast at 3 a.m. (indexes, time-window defaults); the
     dashboards' queries are the product, not an afterthought.
3. Separate the blast radius: telemetry infrastructure lives apart from what it observes — the
   outage must not take its own evidence down (`domains/incidents.md`).
4. Secure the pipeline (`seccraft`'s data domain agrees): telemetry stores access-controlled,
   encrypted, retained per policy — they contain secrets, PII, and business truth.
5. Verify: kill a collector in a test environment — the failure mode behaves as designed
   (backpressure, not data loss, not service outage).

## Exit criteria

- Every hop's failure mode written and verified; retention and cardinality budgets enforced;
  the pipeline monitored itself; the blast radius separated.

## Rules

- Monitor fixes the pipeline, not the signals (`log`/`metric`/`trace`'s scope).
- Telemetry that dies with the service it watches is a design failure, not bad luck.
- The pipeline's own SLO matters: observability is part of the product, not a sidecar.
