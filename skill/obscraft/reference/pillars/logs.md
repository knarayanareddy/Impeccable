# Pillar sheet: Logs

Loaded with `domains/logs.md` when the work is logging. The domain says *what* a log line
must be; this sheet says *how* to get there in a real codebase.

## The instruments

| Question | Instrument |
|---|---|
| Does the line parse as fields? | Structured logger (pino/structured-logging/zap) — the emit path IS the contract |
| Does every warn+ carry context? | A logger-child per request (correlation/span ids bound once, inherited by every line) |
| Do secrets/PII leak? | The deny-list at the source + a planted-secret test in CI (`logs.md`'s privacy rule) |
| Does the level contract hold? | A levels review per module (`ERROR` = needs a human; expected outcomes are not errors) |

## The workflow

1. **Bind the context, then log fields**: the request-scoped child logger carries
   `operation`, `subject`, `correlationId`, `spanId` — lines add only their deltas
   (outcome, error, duration).
2. **Calibrate levels before volume**: fix the level contract per module first (`log`'s
   recalibration); a level with no meaning is noise with a label.
3. **Volume discipline**: one aggregate line per batch (the loop's bug must not flood the
   store); async/batched appenders on the hot path.
4. **Prove the privacy**: a planted-secret CI test + a redaction deny-list — the log store
   is a credential store unless denied the job.

## The bans to enforce

Prose concatenation (`string-concat-log`) · log-per-item (`log-in-loop`) · generic messages
(`generic-error`) · secrets/PII in lines (`secret-in-log`/`pii-in-log`) · ERROR-for-expected-
outcomes.

## Bans

Unstructured lines · level chaos · log storms · leaked credentials · sync logging on hot
paths · messages that name nothing.
