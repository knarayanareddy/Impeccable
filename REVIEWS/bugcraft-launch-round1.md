# Review — bugcraft launch artifacts, round 1 (5-expert panel)

**Scope:** the facet-10 launch: `repro-check.mjs` (bug-record gate), `bug-review.mjs` (decision
daemon), `reference/environments/` sheets, `tests/scenarios.mjs` (39→43 scenarios),
`docs/bugcraft/` + `demos/bugcraft/`, SKILL.md/README wiring, and the checker hardening
(comment stripping with comment-evidence subject selection, symlink-safe walk).

**Verdict:** ship with fixes. The gate, daemon, and sheets are structurally sound; the panel
found six real defects — four checker evasions (the gate-to-the-gate class) and one
cross-suite daemon hang.

## The panel

| Expert | Read | Probe |
|---|---|---|
| Debugging-Method Expert | repro-check.mjs, evidence-floor.md, evidence.md, repro-check.md | Evidence-ladder vocabulary, closure-contract completeness, honesty refusals |
| Live-Tooling Engineer | bug-review.mjs, check.mjs hardening, scenario harness | Daemon protocol edge cases, --wait/--timeout behavior, escaping |
| Runtime Specialist | reference/environments/*.md, SKILL.md/command wiring | Sheet accuracy vs. tooling/reproduction/errors domains; reachable from Setup + commands |
| QA Evasion | tests/scenarios.mjs, check.mjs rules | Marker evasions (quote forms, ASI, f-strings), swallow-form evasions, fixture self-consistency |
| Launch/Growth | docs/bugcraft/, demos/, README, docs/index.html | Doc-link integrity, demo exits both directions, claim accuracy |

## Findings (6, all fixed)

### F1 (critical, cross-suite) — `--wait --timeout abc` waits forever
`parseInt("abc")` → `NaN` → `deadline = Date.now() + NaN = NaN`, and `Date.now() > NaN` is
always false: the `--wait` loop never times out and never errors — an agent calling the
daemon with a mistyped timeout hangs indefinitely. All ten daemons (nine existing +
bug-review) shared the class.
**Fix:** every daemon now validates `--timeout` up front (`usage()` exit 2 when not a finite
positive number) — the same guard family as the `--port` validation from the shipcraft round.
Pinned in the bugcraft harness: "bug-review: non-numeric --timeout is a clean usage error
(no infinite wait)".

### F2 — backtick template literals evaded the debug-marker
`console.log(\`here\`)` — the most common modern-JS form — was invisible because the marker
regex only accepted `'`/`"` quotes. The checker called a file clean that shipped a debug
marker.
**Fix:** the quote class now covers backticks. Pinned: "debug-marker: backtick template
literal and ASI debugger flagged".

### F3 — bare `debugger` (ASI, no semicolon) evaded the debug-marker
`debugger\s*;` required the semicolon; a line ending in bare `debugger` is valid JavaScript
and sailed through. The fix keeps the property-key guard (`debugger:` in an object literal is
legal and not the statement).
**Fix:** `debugger\s*(?!\s*[:=])` — statement form flagged, key form not. Pinned.

### F4 — Python f-string prints evaded the debug-marker
`print(f"here")` — the default form for any Python 3 debugger — was invisible.
**Fix:** the `print` arm accepts an optional `f`/`r`/`rf` prefix. Pinned.

### F5 — `catch { logger.error(e) }` evaded log-and-swallow
The swallow rules only knew `console.*` and `print`. A structured logger is the *good*
citizen elsewhere, but a catch whose entire body is one `logger.error(...)` is the same
swallow with better formatting — the error is recorded and dropped (S2).
**Fix:** `log(?:ger)?\.(error|warn|exception)` joined the single-line JS rule, the JS
multi-line windowed check, and the Python single-line + windowed checks. Pinned.

### F6 — commented-out-debug boundary: `# print("HERE")` must stay flagged
While pinning comment stripping, a draft scenario treated *all* Python hash comments as
prose — including the exact commented-out debug line the rule exists to catch. The rule's
evidence IS the comment; it must survive stripping.
**Fix:** subject selection is explicit — `commented-out-debug` and `uncertainty-marker` read
the RAW line, `disabled-code` reads the stripped line plus the raw line's comment evidence,
everything else reads the stripped line. Both halves pinned: "python hash prose comments are
not evidence" AND "python commented-out print IS the rule's evidence".

## Also tightened (panel notes, fixed in the same pass)

- **Scalar-JSON-in-any-file honesty**: a `"just a string"` file (even named `.yaml`) now
  routes through JSON parsing and refuses with the shape message instead of falling back to
  the zero-records message. Pinned.
- **Symlink-cycle-safe walk** in check.mjs (dev:ino visited sets, file dedupe) — the class
  first fixed in shipcraft, applied to bugcraft before its launch.
- **Harness self-bugs fixed during the build**: the daemon-escaping expectation now matches
  the actual rendered page (`BUG &lt;5&gt;`, `x &amp; y`), and the gap-callout checks use the
  family pattern (gap words, not the `gap:` prefix on 2nd/3rd items).
- Demo runner: typographic quotes in the banner string (unescaped `"fix"` broke the script).

## What the panel validated as correct

- The honesty contract: zero-record parses, wrong-shape JSON, scalar JSON, and unreadable
  files all exit 2 with specific messages (five pinned scenarios) — the gate never claims
  the floor holds on nothing.
- The closure contract matches the floor exactly: `fixed` → root-cause + pin (#5, #8);
  `cannot-reproduce` → instrumentation + ticket (repro.md step 5); status and evidence-level
  vocabularies validated.
- The rung vocabulary accepts both `0`-`5` and the named rungs (observation … verified-fix).
- Environment sheets match the domains (breakpoints over prints; source maps; exception
  chaining; correlation ids; time-travel) and are reachable from SKILL.md Setup step 2 and
  repro/diagnose/trace/fix/review.
- Escaping: `BUG <5>` / `x & y` render escaped in the daemon page (pinned).
- Demo exits: checker rejects before (2 errors + 4 warnings), accepts after; the records
  gate blocks before (12 gaps) and holds after — both directions measured in `run-demo.mjs`.
- Doc link-integrity: all hrefs in `docs/index.html`, all ten skill pages, and README
  resolve; SKILL.md + reference links resolve.
- Suite: 43 bugcraft scenarios + the other nine harnesses all green (306 total at time of
  write).

## Round 2 plan (adversarial re-pass)

Re-probe the fixed classes (evasions, timeout, honesty refusals), plus new targets: YAML
parser edge shapes (empty ids, nested bullets, duplicate records), rung boundary values
(`05`, `minimal repro` vs `minimal-repro`), daemon load refusals (duplicate ids, unknown
status), `--json` parseability on gaps, and the cross-suite regression after the ten-daemon
timeout guard. Then archive and close the facet.
