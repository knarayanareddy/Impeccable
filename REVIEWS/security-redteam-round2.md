# Review — security red-team, round 2 (verification + adversarial re-pass)

**Scope:** re-pass of every round-1 fix plus fresh adversarial targets: the 413 boundary,
checksum-pin idempotence, a fresh-dir install after all edits, walk dedupe, package
contents, and tree cleanliness.

**Verdict:** closed. All round-1 fixes hold under re-probe; the re-pass found two more
real defects (F9, F10), both fixed and pinned. Suite total 341 across eleven harnesses,
all green.

## Re-probes of round-1 fixes (all hold)

| Fix | Re-probe | Result |
|---|---|---|
| F1 body cap | 65,039-byte POST → 400 (parsed); 65,539-byte POST → 413 (capped); unicode body → 400, no crash | boundary exact |
| F2 deep JSON | 20k-deep pipeline JSON | refusal exit 2, no stack trace |
| F3 checksums | `--write` twice → identical pin (md5); tamper → exit 1 "checksum mismatch"; fresh-dir install after all edits → verifies clean, exit 0 | holds |
| F3 symlink refusal | escaping symlink in a skill | exit 1 "escapes the skill" |
| F4 trust clause | all ten SKILL.md carry it; frontmatter intact | holds |
| F5 headers | daemon page | nosniff + no-referrer + no-store present |
| F6 walk dedupe | `walkFiles(skill/criterion)` | 47 files, 47 unique |
| F8 validated baseline | extension/docs | unchanged since round 1 |

## New findings

### F9 (fixed) — the npm package still shipped the skill test harnesses
The round-1 fix relied on `.npmignore`, but npm's documented rule is that paths matched
by the `files` whitelist cannot be excluded by `.npmignore` — the harnesses were still in
the package (`skill/criterion/tests/scenarios.mjs` was in the pack list).
**Fix:** the `files` whitelist now enumerates the shipped trees structurally
(`skill/*/SKILL.md`, `skill/*/reference/`, `skill/*/scripts/`, `skill/*/assets/`,
`skill/criterion/extension/`, `skill/CHECKSUMS.json`, …) — tests are excluded by
construction, not by ignore file. Verified: pack list contains zero `skill/*/tests`
paths and ships `skill/CHECKSUMS.json` (so npm installs are checksum-verified too).

### F10 (fixed) — the harness left its `--skip-verify` fixture behind
The round-1 security scenarios created `TMP + "-skipverify"` but the end-of-run cleanup
list didn't include it — the exact stale-fixture class the harness exists to guard
against.
**Fix:** the dir joins the end-cleanup list; tree check after a full run shows zero
`.tmp-fixtures*` anywhere.

## Cross-suite regression

The daemon hardening touched all ten daemons and the corpus walker is shared by impc,
data-quality, and evaluate-relevance. The full suite re-ran clean (341 checks across 11
harnesses); data-quality stays clean on the 375-file corpus; the frozen relevance
dataset still holds its floors; the demo still exits green; `impc checksums --write`
regenerated the pin after the last content edit and git is clean.

## Final state

- **Supply chain**: SHA-256-pinned installs (365 files) verified by `impc init`, refused
  on mismatch, escaping symlinks refused, `--skip-verify` documented, `impc checksums
  --write` re-pins; npm package ships the pin and zero test harnesses.
- **Daemons**: 64 KB body caps with 413s, nosniff/no-referrer/no-store headers, startup
  port/timeout validation, EADDRINUSE exit 2 — all ten.
- **Tools**: depth-capped JSON walk (exit-2 refusal), inode-deduped corpus walker,
  no-ReDoS patterns (validated).
- **Prompt injection**: trust-boundary clause in all ten SKILL.md files.
- **Evals**: 341 pinned scenarios across eleven harnesses; the seven security scenarios
  live in the suite-tools harness; both archives (`security-redteam-round1.md`, this
  file) record the panel and every fix.
