# Domain: Bisection

Bisection is the fastest route from "somewhere in here" to "this exact thing". The rule: **cut
the space in half, one dimension at a time** — each step discards half the suspects, so the
search is logarithmic, not hopeful.

## The bisection toolkit (`bisect` implements this)

- **Git bisect** — the regression appeared between commit A (good) and B (bad): binary-search the
  history. Each step: check out, run the repro, mark good/bad. The tool does the bookkeeping;
  you provide the honest repro (`domains/reproduction.md` — a flaky repro makes bisect a liar).
- **Input half-splitting** — the failure depends on the data: remove half the input, check
  whether it still fails, recurse into the half that matters. The minimal failing input *is* the
  diagnosis (`minimize`).
- **Timeline splitting** — the failure depends on time/order: split the event stream (logs,
  requests, writes) into before/after halves around the divergence.
- **Space splitting** — the failure depends on *where*: split the system (which service, which
  layer, which module) by testing each boundary's inputs and outputs. The boundary where truth
  diverges is the cause (`trace` finds it; bisect pins it).

## The discipline

- **One dimension at a time.** Mixing dimensions (changing the input *and* the version while
  searching) destroys the halving property. Fix one axis, vary the other.
- **The repro is the probe.** Bisection only works with a deterministic, quick-to-run repro —
  invest in the repro before the bisect (`repro` first, always).
- **Record the bisection log** — each step's verdict, so the path is auditable and re-runnable.
  The log is the evidence trail (`domains/evidence.md`).
- **A bisect that lands on nothing is a finding.** If no single change flips the outcome, the
  cause is emergent — a combination (two changes interacting) or the environment. Split the
  dimensions and try again (`reproduction.md`'s environment protocol).

## When bisection wins

Regressions ("it worked last week"), data-dependent failures, order-dependent failures,
distributed divergences. When the space is huge and the repro is cheap, bisection is the only
sane search.

## Bans (recap)

Bisecting with a flaky repro, mixing dimensions, unrecorded verdicts, linear poking where
halving applies, ignoring an empty-handed bisect.
