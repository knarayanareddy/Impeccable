# Command: respond

Incident readiness: runbooks and the 3 a.m. test (`domains/incidents.md` is the authority). The
pass that proves the observability works — before the incident that would prove otherwise.

## Steps

1. Enumerate the incident classes for the system's journeys: the dependency down, the deploy
   gone wrong, the data corruption, the traffic spike — per class, not per hypothetical.
2. For each class, write the runbook along the incident loop: detect (which alert) → orient
   (which dashboard row) → attribute (which trace/log pattern) → mitigate (the action) → recover
   (the verification) — with real commands and real names (`domains/incidents.md`).
3. Run the 3 a.m. test on the top class: walk it end-to-end in an exercise, including a
   synthetic fault that fires the real alert. Every step that needed the code becomes a ticket
   (`signal-floor.md` Reflexes).
4. Wire the comms and escalation: who gets paged, the escalation chain, the status templates —
   tested in the exercise.
5. Close the loop: every gap found becomes either a telemetry fix (`correlate`, `instrument`) or
   a runbook improvement — recorded, owned, scheduled.

## Exit criteria

- One runbook per incident class; the 3 a.m. test exercised with a synthetic fault; the gaps
  ticketed; the escalation path confirmed.

## Rules

- Respond prepares the response; it doesn't fix the signals — the fixes go to the pillar
  commands.
- A runbook that has never been walked is a document (`domains/incidents.md`).
- The postmortem habit is part of readiness: every real incident rewrites a runbook — the
  exercise teaches the same lesson before the incident does.
