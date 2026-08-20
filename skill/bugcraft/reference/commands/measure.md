# Command: measure

The quantitative pass. Numbers, not adjectives. Complements `review` (judgment) and `audit`
(defects). No edits.

## What gets measured

1. **Speed to truth** — time from bug report to reproduced (MTTR-prologue); report to root
   cause; root cause to verified fix (DORA-adjacent debugging metrics).
2. **Fix quality** — fixes with regression pins (%); fixes with cited reproductions (%);
   symptom-patch rate (fixes at the surfacing layer, by inspection); bug reopen rate.
3. **Evidence destruction** — swallowed errors, log-and-swallows, silent catch returns
   (checker counts); debug markers shipped (checker).
4. **Error quality** — error messages carrying operation + subject + cause (% by sample);
   bare rethrows; unstable error codes.
5. **Class closure** — bugs fixed vs bug classes closed (postmortems with escape analysis vs
   without); class fixes shipped per quarter.
6. **Traceability** — error reports with correlation IDs (%); deploy logs answering "what
   changed?" (%).
7. **Recurrence** — bugs that returned within N months (the pin's failure rate); the same
   symptom filed twice.

## Output

A measurement report: per-metric tables with numbers, the floor comparison against
`evidence-floor.md` and DEBUG.md's targets, then the ranked delta list — cheapest change to
highest diagnosis-speed gain.

## Rules

- Every number cites its method (checker / tracker query / inspection). If a metric can't be
  measured with available tooling, report "not measured" — never guess.
- Quote before/after numbers around any subsequent pass — that's how debugging craft becomes
  visible.
