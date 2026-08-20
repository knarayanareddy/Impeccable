# Command: init

Capture the observability context and policy so every later command reads the same facts. One-time
setup per project (or per service).

## Steps

1. Inspect, don't interrogate. Read the logging setup, the metrics/tracing libraries in use, the
   alert and dashboard config, and the on-call rotation docs. Extract the facts.
2. Ask the user only what the code can't answer:
   - The critical user journeys (2–5): the paths that define the product's health.
   - The telemetry stack: collectors, stores, dashboards, alerting platform — and who runs them.
   - The SLO posture: existing SLOs/SLAs, targets, and who owns them.
   - The on-call reality: shift size, page volume, what a tolerable shift looks like.
   - Policy: log levels per environment, retention tiers, privacy constraints on telemetry.
3. Write `OBSERVABILITY.md` at the project root (or `.obscraft/OBSERVABILITY.md` if the root is
   crowded):
   - The journeys and their SLOs (or the gap)
   - The stack: logging/metrics/tracing/alerting tooling and where each lives
   - Log-level contract, metric vocabulary conventions, sampling strategy
   - Alert policy: actionability contract, page budget, owner model
   - Retention and privacy policy for telemetry data
   - On-call and incident response pointers
4. End with the recommended next step: usually `slo` for the top journey, `audit` if the telemetry
   already looks sloppy, `instrument` for a service going to production.

## Rules

- Facts only — OBSERVABILITY.md is shared memory, not an essay. Keep it <80 lines.
- Never ask what the code or dashboards already answer; never re-ask across sessions.
- No code edits during init. This command captures context.
