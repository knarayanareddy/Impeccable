# Review — suite tools (impc, data-quality, evaluate-relevance), round 2 (verification + adversarial re-pass)

**Scope:** re-pass of every round-1 fix plus fresh adversarial targets: flag edge cases,
blocked-target re-probe, double-run flakiness, publish-chain dry run, and cross-tool
consistency after the shared-lib changes.

**Verdict:** tools closed. All round-1 fixes hold under re-probe; the re-pass found one more
real defect (F13) and two harness self-bugs. 27 suite-tools scenarios pinned, suite total
334 across eleven harnesses, all green twice in a row.

## Re-probes of round-1 fixes (all hold)

| Fix | Re-probe | Result |
|---|---|---|
| F1 file-blocked target | `.claude` as a file, init again | clean per-target failure, exit 1 |
| F2 fixture leak | two full runs | `tests/` contains only the two real files; nothing staged |
| F3 idempotency | install → re-run | "unchanged", exit 0 |
| F4 `http.md` vs URL | data-quality on the real corpus | clean (no false unresolved) |
| F5 prose-path classes | `domains/accessibility.md` prose, `slo.yaml` example, `scripts/CSS` prose | referenced / soft-skipped / ignored as designed |
| F6 backtick tables | criterion's `` `reference/…` `` rows | all resolve; commands check clean |
| F7 cross-skill links | `domains/abuse.md` (apicraft→seccraft), `domains/concurrency` (+.md shorthand) | resolve |
| F9 curation wiring | re-run of the gate | 15 orphans stay wired — corpus clean |
| F10 routing floors | frozen dataset | calibration 91.7%/100% · held-out 60%/100% — thresholds hold |

## New findings

### F13 (fixed) — `impc find --top 0` fell back to the 8-default
`parseInt(get("--top") || "8") || 8` treated 0 as falsy: the recurring truthiness-fallback
class. `--top 0` silently returned eight results.
**Fix:** explicit parsing — a finite number is used as given (0 → zero results + the
no-match note), garbage falls back to 8, ceiling 50. Pinned: "impc find: --top 0 means zero
results, not the default".

### H1/H2 (harness self-bugs, fixed) — `fj` declaration collision
The `--top 0` scenario patch kept the original `const fj =` prefix and the restored
`--json` assignment declared it twice — SyntaxError. Both scenarios now declare/use `fj`
once. The lesson is recorded in the round-1 note about patch anchors: verbatim-check every
patch against the current file before applying.

## Cross-tool regression

The shared corpus lib changed under all three tools (stemming, phrase boost, raw
normalization, backtick extraction) and data-quality's resolver changed under the routing
evals' dataset. The full suite re-ran clean twice in a row (334 checks across 11 harnesses);
data-quality stays clean on the 375-file corpus; the frozen dataset still holds its floors;
the bugcraft demo still exits green; `npm pack --dry-run` still builds the 380-file package
with the `impc` bin. `prepublishOnly` chains quality + relevance + the suite-tools harness,
so a regression in any of them blocks a publish.

## Final state

- **`impc`** — installs any skill into any of five harness targets (project or `--global`),
  with idempotency, conflict protection, symlink dev mode, dry-run, honest inventory
  (`--verify` for live counts), a deterministic router with no-match honesty, and npm
  packaging (`impeccable-suite` v1.0.0, bin `impc`).
- **`data-quality`** — the curated corpus's integrity gate: frontmatter spec, command
  tables, reachability, multi-root link resolution, suite artifacts. 375 files, clean;
  its first run drove 15 curation fixes.
- **`evaluate-relevance`** — 49-query calibration/held-out routing evals with regression
  floors and dataset-integrity refusals. Floors: cal 85%/100%, held-out 55%/95%
  (measured 91.7%/100% and 60%/100%).
- **Harness** — 27 pinned scenarios for all three tools; suite total 334 across eleven
  harnesses.
- **Docs** — docs/installer.md; README quick start, suite-tools bullet, and evals line;
  RESEARCH adoption status for the deep-dive steal-list items 2 and 4.
