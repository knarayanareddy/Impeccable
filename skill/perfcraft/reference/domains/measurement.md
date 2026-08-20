# Domain: Measurement

Measurement is the entire discipline. Every other domain in this skill hangs off it: without a
number, optimization is superstition. This is the differentiator domain.

## The measurement loop (the only workflow that counts)

1. **Baseline** — measure the target as it is, in its real environment, and record it.
2. **Profile** — find where the time actually goes (CPU profile/flame graph for compute; trace for
   distributed; DevTools for browser). The attribution names the fix.
3. **Hypothesize** — one stated cause ("the cart loop re-queries per item") with one predicted gain.
4. **Fix** — one change, smallest that tests the hypothesis.
5. **Re-measure** — same harness, same conditions. Quote before/after.
6. **Decide** — the gain is real and worth its complexity, or the fix reverts.

## Percentiles, not averages

- Report **P50 / P95 / P99 / max** (and the count). The average hides the tail; the tail is the
  experience.
- **P95/P99 are the product numbers** — the worst *normal* users. Max matters for capacity and
  timeouts.
- Averages are acceptable *only* as a secondary summary when the distribution is shown too.

## Benchmark methodology (`benchmark`)

- **Warmup:** JIT/warm caches before timing; discard the warmup runs.
- **Repetitions:** enough iterations for a stable distribution — report n and the variance/σ.
- **Isolation:** one variable per benchmark; same machine, same load, same data; state the
  conditions in the output.
- **Real-shaped data:** production-sized inputs. A sort benchmark on 10 items measures nothing.
- **Noise control:** CPU pinning where available, GC disabled/fixed between runs where the runtime
  allows, and a noise floor measured first.

## Profilers and their questions

| Tool class | Answers |
|---|---|
| CPU profiler / flame graph | Where does CPU time go? (the top frames are the fix list) |
| Heap profiler / allocation traces | What allocates, what churns, what leaks |
| Distributed tracer | Where does *latency* go across services (queue time vs compute) |
| Browser DevTools / Lighthouse / RUM | What does the *user* experience (LCP/INP/CLS, real devices) |

## The attribution rule

The fix targets the profile's top consumers. If a change doesn't move the profile, it didn't fix
anything — it moved furniture. "It should be faster" is not a result; "P95 480ms → 210ms, n=10k,
same harness" is.

## Bans (recap)

One-run benchmarks, no-warmup timing, averages as the story, optimizing below the top of the flame
graph, "it feels faster" as evidence, measurements taken on different hardware called comparisons.
