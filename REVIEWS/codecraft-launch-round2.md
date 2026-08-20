# Review: codecraft launch artifacts — Round 2

**Panel:** Reference Keeper (verification) · Hook-Integration Engineer (adversary re-pass) ·
Live-Tooling Engineer (adversary re-pass) · Language Specialist (re-check) ·
QA Evasion Engineer (harness re-pass).

## Verification of Round 1 fixes

| # | Status | Note |
|---|---|---|
| H1 corrupt-settings guard | ✅ | `on/off --apply` refuse to write when `.claude/settings.json` exists but isn't valid JSON (exit 2, file untouched) — pinned by scenario |
| H2 `<path>` substitution | ✅ | Documented in hooks.md |
| L1 per-skill-copy rationale | ✅ | live.md states the standalone-install rationale |
| G1 sheet wiring | ✅ | modernize.md + align.md now name the sheets as their language authority |
| Q1 cross-skill parity | ✅ | Criterion gained a `commented-out-code` rule (its anti-patterns claimed the class but the checker had no rule) — with S8 row + mapping + scenarios |
| R1 demo header | ✅ | Prose reworded; todo-sprawl count now reflects the 5 real markers |

## Adversary re-pass findings (found and fixed)

| # | Sev | Finding | Resolution |
|---|---|---|---|
| A2-1 | **Major** | Criterion's new commented-out-code rule missed prose-led multi-line blocks (`/*\n.old { … }\n*/`) | File-level block pass over comment interiors; pinned by scenario |
| A2-2 | **Minor** | hooks: double `on --apply` could duplicate entries | Verified idempotent (filter-then-push); pinned by scenario |
| A2-3 | **Minor** | live page escaping didn't encode `>` (safe but asymmetric) | `esc()` encodes `& " < >` in both daemons; pinned by an escaping scenario |

## Final verification

- **27/27** codecraft scenarios green (checker rules, severities, exemptions, windowed catch
  detection, comment stripping, hooks manager incl. corrupt-settings + idempotency, live daemon
  incl. choice protocol + escaping)
- **24/24** criterion scenarios green (cross-skill parity fixes included)
- Suite runner green; docs: 0 broken links; demo: before FAILED (2 errors / 10 warnings),
  after clean ✓; case study numbers match the real run

## Verdict

Facet 2 launch artifacts are review-clean after two rounds. No open findings.
