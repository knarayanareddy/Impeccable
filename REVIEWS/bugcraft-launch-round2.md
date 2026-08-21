# Review — bugcraft launch artifacts, round 2 (verification + adversarial re-pass)

**Scope:** re-pass of every round-1 fix plus fresh adversarial targets: the marker evasions,
the honesty refusals, the YAML parser's fold shapes, rung-boundary values, daemon load
refusals, `--json` machine output, and the cross-suite regression after the ten-daemon
timeout guard.

**Verdict:** facet closed. All round-1 fixes hold under re-probe; the re-pass found one more
real gap (F7) and confirmed two accepted limitations. 45 scenarios pinned, suite total 308,
all ten harnesses green — the suite is complete: every facet now ships its harness.

## Re-probes of round-1 fixes (all hold)

| Fix | Re-probe | Result |
|---|---|---|
| F1 `--wait --timeout abc` | bug-review, pipeline-review, slo-review with garbage timeouts | clean usage exit 2, no hang (all ten daemons carry the guard) |
| F2 backtick template literal | `` console.log(`here`) `` | flagged |
| F3 ASI `debugger` | bare `debugger` line vs. `{debugger: 1}` key | statement flagged, key not |
| F4 f-string print | `print(f"here")` | flagged |
| F5 logger.error swallow | `catch (e) { logger.error("op", e); }` | flagged (error) |
| F6 comment-evidence selection | prose hash comments vs. `# print("HERE")` | prose clean; the commented-out print still flags |
| scalar-JSON honesty | `"just a string"` in a `.yaml` file | shape refusal, exit 2 |
| symlink cycle | cycle under a scanned dir | walk terminates, file scanned once |

## New findings

### F7 (fixed) — folded `observed: |` blocks were read as present-but-empty
The records parser handled `key: value` pairs and bare-key containers, but a YAML folded
scalar (`observed: |` followed by indented lines) was stored as the literal `"|"`: the field
read as *present* while its actual content was discarded — and an empty fold
(`observed: |` with no lines) passed the quartet. The gate would hold the floor for a record
whose observed symptom it never saw.
**Fix:** `key: |` / `key: >` opens a container like a bare key — deeper lines accumulate
into the field, and an empty fold reads as absent (the gap fires). Pinned:
"repro-check: folded observed block is read; empty fold is a gap".

### A1 (accepted) — rung 0 is a valid claim
`evidence-level: 0` ("it seems broken — a direction to look") is on the ladder and stays
accepted for open records; the quartet requirements (observed/steps/environment) already
force any gated record beyond rung 0's evidence, so the rung cannot be used to smuggle a
blind fix past the closure contract. Documented, not changed.

### A2 (accepted) — debug-marker's metasyntactic over-approximation
`console.log("foo")` / `console.log("hello")` (literal metasyntactic-variable prints) flag
at error severity; genuine but rare. The floor's stance is explicit: a literal-word print
IS the classic print-debugging tell, and the false positive costs a glance while the false
negative ships a marker. The reason-comment escape and `cleanup` are the recourse.
Documented, not changed.

## Cross-suite regression

The ten-daemon `--timeout` guard and the checker rule broadens landed in the same commit
family; the full suite re-ran clean with every harness's own daemon protocol, collision, and
port/timeout scenarios intact: 308 pinned scenarios across ten harnesses, 0 failed. The
REVIEWS index now carries the launch-round archive table for all ten facets.

## Final state of the facet (and the suite)

- **Gate:** `repro-check.mjs` — repro-signature quartet + evidence rung + closure contract
  (fixed → root-cause + pin; cannot-reproduce → instrumentation + ticket); YAML-subset
  parser with folded blocks, native JSON, scalar-JSON refusals, zero-record refusals;
  `--json` machine output pinned.
- **Daemon:** `bug-review.mjs` — close/flag/n-a, red closure gaps (repro, root-cause, pin),
  duplicate-id and status-vocabulary refusals, port + timeout validation, EADDRINUSE-safe,
  trusted-network note.
- **Sheets:** `reference/environments/` (browser-javascript, python-services,
  distributed-systems), wired from SKILL.md Setup step 2 and repro/diagnose/trace/fix/review.
- **Evals:** 45 scenarios pinning checker rules, evasion forms, comment stripping with
  comment-evidence selection, gate refusals and folds, daemon protocol, escaping, and port
  collision.
- **Launch:** docs page, case study, before/after demo (checker rejects before, gate blocks
  before; both accept the after), suite-home and README wiring, link-integrity verified.

**Suite completion:** with bugcraft's harness landed, `scripts/run-evals.mjs` reports zero
"no scenario harness" lines — all ten facets ship their launch pass: gate tool, review
daemon, specialist sheets, behavioral evals, docs, demo, and case study, each through two
expert review rounds.
