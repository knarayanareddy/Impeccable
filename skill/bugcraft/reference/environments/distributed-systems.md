# Environment sheet: Distributed systems

Loaded with `domains/tooling.md`, `domains/reproduction.md`, `domains/errors.md` when the bug
crosses a service boundary. The domains say *what* the debugging pass must be; this sheet says
*how* to get there when the failure is spread across processes — the hardest debugging there is.

## The instruments

| Question | Instrument |
|---|---|
| Which service diverged? | **Distributed traces** with one correlation id threaded end-to-end (obscraft's traces domain — `trace` walks them); the span where latency or error appears is the boundary |
| What did each service believe? | **Per-service event logs** joined on the correlation id — the same request from every side, side by side |
| Can the failure be replayed? | **Record/replay**: record the request/response stream at the gateway (or time-travel runtimes — rr, WinDbg TTD), replay it against a local cluster (`domains/tooling.md`) |
| Heisenbug under observation? | Time-travel debugging — record once, replay the failure backwards and forwards; the observation stops being the disturbance |
| What state was in each node? | **Core dumps / heap snapshots / container exit snapshots** taken at failure — the state, not the story about the state |
| Which change broke it? | The **deploy log + the diff** (shipcraft's monitor): which service changed when the failure started (`domains/bisection.md`'s service-scale cousin) |
| Ordering / race? | Vector clocks / sequence numbers in the event logs; a Lamport-ordered view beats "service A was just slow" |

## The workflow

1. **Capture the scene across all services**: the trace id, the timestamps, each service's
   log slice for the same id — the distributed scene, recorded before anything changes
   (`domains/evidence.md`).
2. **Localize the divergence**: walk the trace to the span where truth stops matching
   expectation (`trace`) — then debug that service with its environment sheet.
3. **Reproduce on a local cluster**: the replay from recorded traffic, or a minimal
   client + fake peers — the failure on demand, on the laptop (`commands/repro.md`;
   production is where you *see* the bug, the laptop is where you *catch* it).
4. **Fix at the boundary**: the bad timeout, the missing retry idempotency, the
   misunderstood contract — and every observation (including the odd timings) explained
   (`domains/fixes.md`).
5. **Pin it**: an integration test with the failing interleaving or payload — plus the
   observability gap that let it hide, closed (`postmortem` kills the class).

## The bans to enforce

- Production as the laboratory: read-only (traces, logs, metrics) — never a mutating
  experiment in prod (`domains/tooling.md`).
- Correlation ids dropped at a boundary — the trace dies there and so does the diagnosis
  (obscraft's `no-correlation-propagation` class).
- Swallowed errors inside retry loops and queues — the failure that vanishes into a retry
  queue was evidence, now deleted (S1).
- Timeouts without the deadline in the error message — "upstream timeout" that names
  nothing helps nobody (`domains/errors.md`).
- "It was a race" as a conclusion without a recorded interleaving — the race is a
  hypothesis until the ordering is captured (`evidence-floor.md` #8).
