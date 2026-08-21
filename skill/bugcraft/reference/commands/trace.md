# Command: trace

Follow the failure through the system: where truth diverges across layers. The distributed bug's
detective pass — traces, logs, and correlation IDs are the trail. No code edits.

## Steps

1. Anchor on one failing request (from the error report/logs) and pull its full story: the
   trace, the log lines with its correlation ID, the metrics around its window
   (`obscraft`'s traces/logs domains are the authority; for the cross-service playbook, load
   `reference/environments/distributed-systems.md`).
2. Walk the journey hop by hop and find the boundary where truth diverges: inputs in → outputs
   out, at each service/database/queue crossing. The divergence is the cause candidate
   (`domains/bisection.md`'s boundary splitting).
3. Classify what you find:
   - Data divergence — the value changed shape/semantics between hops (encoding, timezone,
     truncation, null).
   - Timing divergence — the failure correlates with queue wait, timeouts, race windows.
   - State divergence — one service's view of the world disagrees with another's (cache, replica
     lag, config).
4. Deliver the divergence report: the exact hop, the input/output pair that disagrees, the
   evidence level (`domains/evidence.md`), and the handoff to `diagnose`/`repro` to confirm and
   localize.

## Exit criteria

- The divergence localized to a boundary with the disagreeing pair cited; or the gaps that
  blocked the trace (missing correlation IDs, absent spans) ticketed — the trace's gaps are
  findings, not dead ends (`obscraft`'s correlate closes them).

## Rules

- Trace reads the system; it never mutates it (`domains/tooling.md`).
- One request, followed end to end — the representative failing request beats the aggregate
  (`evidence-floor.md` Reflexes: the weird detail is the clue).
- If the traces don't exist, the first deliverable is the gap ticket — you can't trace a rumor.
