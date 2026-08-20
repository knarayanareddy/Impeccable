# OBSERVABILITY.md — example shape

The canonical observability-context file written by `init`. Copy this shape; keep it tight.

```markdown
# Journeys & SLOs
checkout: 99.9% complete < 3s over 30d — owner: payments-team, reviewed weekly
feed: 99.5% load < 1.5s over 30d — owner: growth

# Stack
logging: <pino/winston/zap> → <collector> → <store> · metrics: <prometheus/otel> →
<store> · tracing: OTel with error over-sampling · alerts: <alertmanager/PagerDuty>

# Conventions
log levels: debug off in prod; warn+ structured with correlation+span ids
metric names: OTel semantic conventions + domain-first custom names
sampling: head 10% + tail keep-all-errors/slow

# Alert policy
every page states condition + action + runbook + owner; page budget: <= 5/shift
severities: P1 pages, P2 tickets, P3 logs

# Retention & privacy
hot 7d queryable · warm 90d aggregated · cold 1y compliance
secrets/PII: redacted at source, deny-lists in CI

# On-call & incidents
rotation: <schedule> · runbooks: runbooks/ · the 3 a.m. test: last run <date>
```
