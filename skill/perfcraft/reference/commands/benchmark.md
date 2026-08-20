# Command: benchmark

Write and run benchmarks with methodology (`domains/measurement.md` is the authority). A benchmark
is a scientific instrument, not a stopwatch: it exists to answer "is A faster than B, and by how
much, with what confidence?"

## Steps

1. State the question first: which operation, against what data, compared to what baseline.
2. Build the harness per the methodology:
   - **Warmup** runs, discarded; **repetitions** enough for stability; **variance** reported.
   - **Real-shaped data** — production-sized inputs, not toys.
   - **Isolation** — one variable; same machine, load, and conditions for comparisons.
   - **Noise floor** — measure the harness's own noise before believing deltas.
3. Run the baseline and the candidate; record both distributions (median/P95, not one number).
4. Report honestly: n, variance, conditions, and the delta with its confidence — "P95 480ms →
   210ms (±12ms), n=10,000, same harness." If the delta is inside the noise floor, say so.
5. Wire the benchmark into the project's perf tooling (PERF.md) so the next run is one command.

## Rules

- A benchmark without warmup, repetitions, and variance is an anecdote — refuse to draw
  conclusions from it.
- Never benchmark with toy data and call it production-shaped.
- Benchmarks measure code, not confidence: a suspiciously perfect number gets a suspicion, not a
  celebration.

## Exit criteria

- The question answered with distributions and variance; the harness re-runnable from PERF.md;
  conclusions stated with their limits.
