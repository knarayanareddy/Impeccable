# Domain: Logs

Logs answer "what happened, in order, with detail." The craft: structured fields, levels used per
contract, and zero secrets.

## The log line contract

Every warn-and-above line carries, as structured fields:
- **operation** — what the code was doing (`checkout.payment`)
- **subject** — on what (`order_id`, `user_id` — pseudonymous where possible)
- **outcome** — what happened (`status: failed`, `rows: 0`)
- **error** — the error class and message (codes, not prose)
- **correlation_id + trace_id** — the thread that links to the trace (`traces.md`)
- **duration_ms** — how long the operation took

Prose is for humans; fields are for queries. A log line that needs regex to parse is a string, not
a signal (`anti-patterns.md` L4).

## Levels as a contract

| Level | Meaning | In production |
|---|---|---|
| DEBUG | Developer breadcrumbs | off |
| INFO | Lifecycle facts: deploy, config, job start/end | selected events |
| WARN | Recoverable problems: retry, degrade, near-limit | on |
| ERROR | Failed operations needing attention | on |
| FATAL | The process is dying | on |

- One convention per codebase: a WARN that pages nowhere and an ERROR nobody reads mean the levels
  have no meaning. Recalibrate until they do (`log`).
- Never log at ERROR for expected business outcomes (a failed payment validation is INFO/WARN with
  a `reason` field — ERROR is for things that need a human).

## Volume discipline

- **One line per meaningful event**, never per loop iteration (`anti-patterns.md` L5): aggregate
  the batch ("processed 500 items, 2 failed").
- **Sampled debug in hot paths**; the hot path's sync logging is a latency tax
  (`perfcraft`'s latency domain agrees) — async/batched appenders where the platform allows.
- **Rate-limit the pathological logger** — the bug that logs in a tight loop must not take the
  store down with it.

## Privacy and secrets (non-negotiable)

- Never log: passwords, tokens, API keys, cookies, authorization headers, full request bodies,
  raw PII (`signal-floor.md` #7). Redact at the source with a deny-list; verify with a planted
  secret test (`seccraft`'s secrets domain agrees).
- Pseudonymize identifiers where the product allows; log hashes, not values.
- Telemetry access is itself least-privilege: the log store is a sensitive system
  (`telemetry.md`).

## Bans (recap)

Prose logs, level chaos, log-per-item, secrets or PII in lines, sync logging on hot paths,
ERROR-for-expected-outcomes.
