# Review — shipcraft launch artifacts, round 2 (verification + adversarial re-pass)

**Scope:** re-pass of every round-1 fix plus fresh adversarial targets: the honesty refusals,
the escape hatches, the nine-daemon port guard, daemon protocol edge cases, naming variants,
JSON shapes, and the cross-suite regression after shared-code changes.

**Verdict:** facet closed. All round-1 fixes hold under re-probe; the re-pass found one more
real gap (F7) and confirmed two accepted limitations. 49 scenarios pinned, suite total 263,
all nine harnesses green.

## Re-probes of round-1 fixes (all hold)

| Fix | Re-probe | Result |
|---|---|---|
| F1 multiline `run: \|` / `>` gating | mask + secret echo inside a block | both flagged; gate fails |
| F1 + escape hatch interaction | `run: \|\n npm test \|\| true  # reason: known flaky upload` | passes — the reason comment survives inside a folded block |
| F2 non-numeric `--port` | `--port abc`, `--port 0` | usage exit 2, no stack trace (all 9 daemons) |
| F3 collision message | second daemon on a live port | exit 2 + `cannot bind port \d+` |
| F4 `--force-with-lease` | checker + gate | passes, not flagged |
| F5 bare `deploy:` job key | `.gitlab-ci.yml` with only `deploy:` | `deploy-without-rollback` fires |
| F6 pnpm/bun | frozen and non-frozen forms | flagged unless frozen |
| duplicate step names | two entries named `a` | load refusal, clear message |
| comment-only lines | `# run: npm test \|\| true` in a workflow | not evidence, any rule |
| symlink cycle | `dir/sub/loop -> dir` | walk terminates; file scanned once |
| Dockerfile variants (new F7) | `app.Dockerfile` / `Dockerfile.prod` | line-scanned by both tools |

## New findings

### F7 (fixed) — `app.Dockerfile` / `Dockerfile.prod` were invisible
`isCiFile` matched the exact basename `dockerfile`, and ci-check's fallback regex anchored
`dockerfile.*` to the start of the name. Real repos use `<name>.Dockerfile` and
`Dockerfile.<env>` (e.g. `docker build -f deploy.Dockerfile`); a `RUN npm install` inside them
was silently unscanned by both tools.
**Fix:** `isCiFile` accepts `dockerfile`, `dockerfile.*`, and `*.dockerfile`; the ci-check
fallback regex was broadened identically. Pinned: "Dockerfile variants (Dockerfile.prod /
app.Dockerfile) are CI files".

### A1 (accepted) — lexical secret-echo over-approximates literal text
`echo "password reset requested"` flags at error severity: the checker cannot distinguish a
secret from the word "password" in prose, and prefers the false positive over the silent leak
(`echo hunter2`-style literals are real leaks). Documented limitation of the deterministic
checker; the reason-comment escape and human review (`/shipcraft audit`) are the recourse.

### A2 (accepted) — node EPIPE under shell pipe truncation
`node ci-check.mjs … | head -1` can raise a non-deterministic EPIPE stack trace when the
reader closes the pipe mid-write (Node's stdout behavior, shared by every CLI in the family).
All harness/demo paths capture output in full and never see it; no logic defect. Left as-is
deliberately rather than diverging one tool from the family.

## Cross-suite regression

The nine-daemon port guard and the eight-daemon message interpolation landed in the same
commit family; the full suite (scripts/run-evals.mjs) re-ran clean with every harness's own
daemon protocol and collision scenarios intact: 263 pinned scenarios across nine harnesses,
0 failed.

## Final state of the facet

- **Gate:** `ci-check.mjs` — workflow YAML-subset (with `|`/`>` folded blocks), JSON walk,
  Dockerfile/Makefile/docker-compose line-scan fallback; zero-step, wrong-shape, and
  unrecognized-format refusals; `--strict`/`--json`; shared vocabulary with check.mjs.
- **Daemon:** `pipeline-review.mjs` — ship/flag/n-a, red gap callouts (rollback, high-risk
  approval), duplicate-name and port validation, EADDRINUSE-safe, trusted-network note.
- **Sheets:** `reference/platforms/` (github-actions, gitlab, jenkins), wired from SKILL.md
  Setup step 2 and five consuming commands.
- **Evals:** 49 scenarios pinning checker rules, comment stripping, project-scope gating,
  severity semantics, gate parsing/refusals, daemon protocol, escaping, and port collision.
- **Launch:** docs page, case study, before/after demo (checker rejects before, gate blocks
  before; both accept the after), suite-home and README wiring, link-integrity verified.
