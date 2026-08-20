# Command: minimize

Shrink the repro to the smallest failing case — the minimal repro *is* the diagnosis
(`domains/reproduction.md` is the authority). Every element you remove that keeps the failure is
one more suspect eliminated.

## Steps

1. Start from the working repro and remove, one element at a time: inputs, data rows, config,
   steps, dependencies — anything the failure might not need.
2. After each removal, re-run: fails → the removal was irrelevant (keep it out); passes → the
   removal mattered (put it back, note it).
3. Continue until nothing removable remains — the minimal failing case.
4. Read the answer: the minimal repro names the cause. The surviving elements *are* the
   conditions; the boundary they form is the broken assumption (`domains/diagnosis.md`).
5. Deliver: the minimal repro artifact, the eliminated-suspects list, and the cause candidate —
   hand to `fix` (or `diagnose` to confirm when the minimal case still permits two theories).

## Exit criteria

- The minimal failing case, as an artifact, with the elimination log; the cause candidate
  stated; the repro still deterministic (`repro`'s guarantee).

## Rules

- Minimize one element at a time — batch removals break the elimination logic
  (`domains/bisection.md`'s one-dimension rule).
- The elimination log is the evidence (`domains/evidence.md`): unrecorded minimizations are
  unrepeatable ones.
- When minimizing stops early ("removing anything fixes it"), the remaining elements are the
  bug's entire condition — that's the answer, not a failure.
