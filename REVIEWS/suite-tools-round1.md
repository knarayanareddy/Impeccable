# Review — suite tools (impc, data-quality, evaluate-relevance), round 1 (5-expert panel)

**Scope:** the two adoptions from the ui-ux-pro-max deep dive — the `impc` installer/router,
the curated-data quality gate, and the relevance evals — plus the corpus curation the quality
gate drove. Panel read the tools, ran them end-to-end, and probed adversarially.

**Verdict:** ship with fixes. The architecture (installer + corpus gate + routing evals) is
right; the panel found twelve defects — two critical, five checker-family false-positive
classes, and five harness/tool bugs.

## The panel

| Expert | Read | Probe |
|---|---|---|
| Installer/Distribution Engineer | impc.mjs, package.json, docs/installer.md | Blocked target dirs, idempotency, link/global/dry-run paths, npm pack |
| Retrieval/Data-QA Engineer | corpus.mjs, evaluate-relevance.mjs, relevance-dataset.json | Scorer fairness, splits, dataset integrity, threshold honesty |
| Corpus Curator | data-quality.mjs, the 375-file corpus | Reachability, link resolution classes, orphaned knowledge |
| QA Evasion | tests/scenarios.mjs, run-evals.mjs | Harness self-consistency, stale fixtures, false-positive guards |
| Launch/Growth | README, RESEARCH adoption note, npm surface | Claim accuracy, publish chain, doc links |

## Findings (12, all fixed)

### F1 (critical) — `impc init` crashed when a FILE blocked the target dir
`mkdirSync(targetDir, { recursive: true })` with a file at `.claude/` threw ENOTDIR past the
install path — raw stack trace, no exit code. **Fix:** mkdir/rm wrapped; the failure is a
clean per-target error, exit 1. Pinned: "impc init: a file blocking the target dir fails
cleanly".

### F2 (critical) — the harness leaked its fixture dirs into git
`tests/.tmp-fixtures-*` cleaned only at the *start* of a run, so a completed run left them
behind and they were committed. **Fix:** end-of-run cleanup for every fixture dir +
`tests/.tmp-fixtures*` in .gitignore; the leaked files removed.

### F3 — the installer's idempotency check never matched
The manifest compared the source (with `tests/`) against the install (without) — every
re-run reported "exists and differs". **Fix:** manifests exclude `tests/` on both sides;
re-runs report "unchanged". Pinned.

### F4 (checker family) — `http.md` was treated as a URL
`resolveRef`'s `/^http/` guard rejected the bare filename `http.md` — the skill's own
`domains/http.md` was reported unresolved. **Fix:** `^https?:`. (The same class the
shipcraft checker once had on comment starts — boundary guards need the full token.)

### F5 (checker family) — prose-path false positives and false negatives
The prose reference regex demanded a dir prefix (missed `per domains/accessibility.md`),
captured trailing sentence punctuation (`domains/motion.md.`), flagged prose like
"blocked by scripts/CSS", and flagged example filenames (`slo.yaml`, `bugs.yaml`) in
usage blocks. **Fix:** prefix-optional pattern, extension-or-slash requirement, punctuation
strip, URL-tail guard, and bare backtick tokens resolve soft (own-skill basename; an
unresolved bare name is shorthand, not a defect).

### F6 (checker family) — backtick-path command tables weren't references
criterion's Reference column uses `` `reference/commands/x.md` `` instead of markdown links;
the commands check and the reachability graph both missed them, flagging everything as
orphaned. **Fix:** `backtickPaths()` joins the reference extraction in `commandRows` and
the link graph.

### F7 (checker family) — `reference/`-relative and cross-skill links unresolved
`domains/color.md` from a file inside `reference/commands/` resolves against
`reference/`, not the file's dir; `domains/abuse.md` from apicraft lives in seccraft;
`domains/concurrency` needs the `.md` shorthand. **Fix:** candidate order
(file dir → `reference/` → skill dir → repo root → other skills) + `+.md` shorthand.

### F8 — `impc list` overstated scenario counts
Static `scenario(` counts (206) disagreed with the true harness counts (308). **Fix:**
honest static inventory (commands/references/harness) + `--verify` mode that runs the
harnesses for live counts (334 today) — and a guard so a red harness shows `?` instead of
crashing the inventory.

### F9 (corpus curation, driven by the new gate) — 15 orphaned knowledge files
All ten `init` commands shipped template files they never referenced; criterion's
anti-patterns.md and extension/README.md were unlinked; threatmodel's template and the
perfcraft/obscraft daemon command docs were orphaned. All wired (Setup steps, command
steps, SKILL.md rows). The gate earned its keep on day one.

### F10 (router) — word-family and phrase evidence were missing
`dense`/`densify`, `migrate`/`migration`, `flaky`/`flakiness` didn't match; `expand/contract`
wasn't matched across the slash; the query `rename a column…` drowned in a cross-skill
title collision. **Fix:** curated synonym-stem map, exact-bigram phrase boost over
normalized raw text, and a documented calibration protocol (corpus enrichment where the
right playbook lacked its natural phrasing; dataset rewording where a query was
unrepresentative; two intent corrections where a different playbook was defensibly
right). Measured: calibration 91.7% top-1 / 100% top-3; held-out 60% top-1 / 100% top-3 —
floors set just below (85/100 · 55/95) so regressions fail loudly.

### F11 (harness) — self-bugs
`require()` in ESM, a missing fixture mkdir, a stale-fixture guard that ran only at
start, a `--link` scenario whose cwd was removed, and a dataset-defect fixture whose
path rewrite didn't apply. All fixed; the harness now cleans every fixture dir at both
ends.

### F12 (harness) — the no-match scenario used a real query
"zzqqxx nonsense query" contained the real vocabulary token `query` and returned real
results. Replaced with vocabulary-free "flibbertigibbet wobblebong" so the
no-strong-match contract is actually pinned.

## What the panel validated as correct

- The overwrite policy (unchanged / conflict-skip / --force) behaves as documented.
- `--global` respects `HOME`; `--link` creates real symlinks; dry-run writes nothing.
- `impc find` honesty: vocabulary-free queries report no strong match; `--json` parses.
- `data-quality` on the real corpus: clean (375 files); the fixture defects (broken link,
  orphan file) are found with exact messages.
- `evaluate-relevance`: dataset-defect entries refuse at exit 2; empty/unknown splits
  refuse; thresholds hold on the frozen dataset.
- npm surface: `npm pack --dry-run` builds a valid 380-file package with `impc` as the
  bin; `prepublishOnly` chains quality + relevance + the suite-tools harness.
- Suite: 334 pinned checks across 11 harnesses, all green; demo unaffected.

## Round 2 plan (adversarial re-pass)

Re-probe F1–F12, plus: double-runs for flakiness, `impc init --ai all --dry-run --global`,
find with `--top 0`/garbage, data-quality on a root without `skill/`, relevance with a
duplicated query, and the publish-chain dry run after all changes.
