# Command: log

Structured-logging craft: levels, fields, cardinality (`domains/logs.md` is the authority). The
pass that turns prose into signals — the highest-frequency observability fix in real codebases.

## Steps

1. Audit the current logging in the target: which levels are used, for what; which lines are
   prose; where secrets/PII slip through; where the hot path logs synchronously.
2. Fix per the contract:
   - **Structure:** warn+ lines become fields (operation, subject, outcome, error, correlation
     ID, duration) — string concatenation becomes structured fields
     (`anti-patterns.md` L4).
   - **Levels:** recalibrate per `logs.md`'s table — ERROR for what needs a human, WARN for
     recoverable, INFO for lifecycle, DEBUG off in prod.
   - **Volume:** log-per-item loops become one aggregate line per batch
     (`anti-patterns.md` L5); sync logging leaves the hot path (async/batched appenders).
   - **Privacy:** wire the deny-list (secrets/PII) with a planted-secret test
     (`signal-floor.md` #7).
3. Verify: a sampled warn+ line renders as fields in the log store; the planted secret is
   redacted; the hot path's log writes are out of the latency profile.

## Exit criteria

- Warn+ lines structured per the contract; levels follow the calibrated table; no secrets/PII in
  output; the log store query "show checkout errors with trace IDs" works.

## Rules

- Log fixes the *lines*, not the architecture — the log pipeline is `monitor`'s scope.
- Expected business outcomes stay non-ERROR — recalibrating levels is part of the craft, not a
  downgrade.
- One convention per codebase: the contract in OBSERVABILITY.md wins over personal taste.
