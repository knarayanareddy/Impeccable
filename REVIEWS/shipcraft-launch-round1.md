# Review — shipcraft launch artifacts, round 1 (5-expert panel)

**Scope:** the facet-9 launch: `ci-check.mjs` (pipeline gate), `pipeline-review.mjs` (decision
daemon), `reference/platforms/` sheets, `tests/scenarios.mjs` (43→48 scenarios),
`docs/shipcraft/` + `demos/shipcraft/`, SKILL.md/README wiring, and the cross-suite daemon
message fixes. Panel read the code, ran the tools, and probed adversarially.

**Verdict:** ship with fixes. The gate and daemon are structurally sound; the panel found six
real defects — two of them the worst class (silent false-negatives), two cross-suite.

## The panel

| Expert | Read | Probe |
|---|---|---|
| CI/Gate Expert | ci-check.mjs, lib/pipeline-rules.mjs, ci-check.md | Multiline YAML blocks, JSON shapes, honesty refusals |
| Pipeline-Tooling Engineer | pipeline-review.mjs, check.mjs refactor, scenario harness | Daemon load refusals, port handling, escape hatches |
| CI-Platform Specialist | reference/platforms/*.md, SKILL.md/command wiring | Platform-sheet accuracy vs. domains; wired from Setup + commands |
| QA Evasion | tests/scenarios.mjs | Fixture self-consistency, false-positive guards, comment stripping |
| Launch/Growth | docs/shipcraft/, demos/, README, docs/index.html | Doc-link integrity, demo exits both directions, claim accuracy |

## Findings (6, all fixed)

### F1 (critical) — ci-check drops multi-line `run: |` / `run: >` blocks — silent false-negative
The workflow parser read only `key: value` carriers; the body of a folded block (`run: |\n npm
test || true\n echo $API_KEY`) was discarded, so the gate printed **"gate holds ✓"** over a
pipeline containing a red mask and a secret echo. The worst class of failure for a gate.
**Fix:** the parser now tracks a `cont` continuation carrier — deeper-indented plain lines
under a `|`/`>`-folded `run`/`script`/`command` append to the step, and `cont` joins the
carrier list scanned by the rules. Pinned by scenario "ci-check: multiline run block is
gated (no silent drop)".

### F2 (critical, cross-suite) — every daemon crashes with an uncaught `validatePort` on a non-numeric `--port`
`parseInt("abc")` → `NaN` → `server.listen(NaN)` throws synchronously, past the EADDRINUSE
error handler: raw stack trace, exit 1, not a usage error. All nine daemons (8 existing +
pipeline-review) shared the class.
**Fix:** every daemon now validates `--port` up front (`integer 1–65535`, else usage exit 2).
Pinned in the shipcraft harness: "pipeline-review: non-numeric port is a clean usage error".

### F3 (cross-suite) — the 8 existing daemons' port-collision message didn't interpolate
`console.error("… cannot bind port ${port} — ${e.message} …")` used double quotes, printing
the literal `${port}`/`${e.message}` — the message existed but lied about the port.
**Fix:** all eight converted to template literals; shipcraft's daemon was born correct.
Pinned: "pipeline-review: clean exit 2 on port collision with a real message" (regex-asserts
`cannot bind port \d+`).

### F4 — `git push --force-with-lease` flagged as `force-flag`
`(-f|--force)\b` matched the prefix of the *safe* force form — the floor's own remedy for
force pushes was reported as the anti-pattern.
**Fix:** the regex now carries `(?!-with-lease)`. Pinned: "force-flag: --force-with-lease is
the safe form and passes".

### F5 — `deploy-without-rollback` never fired for bare `deploy:` job keys
`\b(deploy:|…)\b` demands a word boundary *after* the colon; `deploy:\n` (colon then
newline, both non-word) never matched — the rule only ever fired via `kubectl apply`-style
alternatives. A rollback-less `deploy:` job silently passed the checker (and the gate).
**Fix:** `\bdeploy\b|deploy\s*:|release\s*:|…` in both check.mjs and ci-check.mjs (shared
behavior pinned by the two deploy-without-rollback scenarios).

### F6 — unpinned-install vocabulary missed pnpm and bun
`pnpm install` / `bun install` drift exactly like `npm install` and weren't flagged.
**Fix:** both joined the rule with their frozen-lockfile exemptions. Pinned by
"unpinned-install: pnpm/bun flagged; frozen forms pass".

## Also tightened (panel notes, fixed in the same pass)

- **Duplicate step names** in `steps.json` could never complete a submission (verdict map
  collapses) — the daemon now refuses duplicates at load with a clear message. Pinned.
- **Comment-only lines were still evidence for `masked-failure`** (its raw-line exemption let
  a fully commented `# run: npm test || true` line flag) — comment-only/blank lines are now
  skipped before any rule, in check.mjs, ci-check's line fallback, and ci-check's step loop.
  Pinned by the two comment-stripping scenarios.
- **`SECRET_NAME` missed `$DATABASE_PASSWORD`-style env-var forms** (word-boundary regex) —
  extended to `_`/`$`/`{`-preceded forms; `echo $DATABASE_PASSWORD` is now the pinned error
  scenario.
- **`kubectl apply -f`** (`-f` = `--filename`) was flagged as force — the force-flag rule now
  requires `--force` everywhere except `git push -f`. Pinned.
- **Checksummed installers** (`curl -o f && sha256sum -c s && bash f`) — the H4 floor itself —
  were flagged by `pipe-to-shell`; the exemption is pinned.
- **Symlink-cycle-safe walk** in check.mjs (visited dev:ino sets; files deduped when reached
  twice through symlinks) — a cycle now terminates instead of recursing forever.
- **`b.json` stray artifact** removed from the repo root (untracked criterion-demo leftover).
- README case-studies line now lists all nine shipped case studies instead of two.

## What the panel validated as correct

- The honesty contract: zero-step parses, wrong-shape JSON, unrecognized formats, and
  unreadable files all exit 2 with specific messages — the gate never claims "holds" on
  nothing (five pinned scenarios).
- The `# reason…` escape hatch survives comment stripping (subject-selection on raw lines),
  in both tools.
- Platform sheets match the domains (gates block; secrets by reference; build once; rollback
  in code) and are reachable from SKILL.md Setup step 2 and pipeline/gate/audit/review/deploy.
- Escaping: `deploy & <prod>` renders escaped in the daemon page (pinned).
- Demo exits: checker rejects before (2 errors + 4 warnings), accepts after; the gate blocks
  before (7 findings) and holds after — both directions measured in `run-demo.mjs`.
- Doc link-integrity: all hrefs in `docs/index.html`, all nine skill pages, and README
  resolve; SKILL.md + reference links resolve.
- Suite: 48 shipcraft scenarios + the other eight harnesses all green (262 total at time of
  write).

## Round 2 plan (adversarial re-pass)

Probe the fixed classes again (multiline blocks, escape hatches, refusals), plus new targets:
duplicate/weird step shapes, JSON walks with nested commands, `--wait` timeouts, port
collision under the new validation, and cross-suite regression after the nine-daemon port
guard. Then archive and close the facet.
