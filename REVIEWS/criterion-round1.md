# Review: criterion (UI/UX) — Round 1

**Panel:** Reference Keeper (pbakaus/impeccable expert) · Domain Principal (design director) ·
Skill Author (Agent Skills spec craft) · Practitioner (daily user)

## Reference Keeper — pattern fidelity vs the reference repo

| # | Sev | Finding |
|---|---|---|
| R1-1 | **Major** | No **`live` mode**. The reference's signature iteration command (browser-based visual variants) is absent. Criterion's differentiator is *measure*, but iteration-in-the-medium is category-standard — add `live` with bounded rounds. |
| R1-2 | **Major** | No **`document` command**. The reference generates DESIGN.md from existing code (its `document`). Criterion's init asks; it never *reads*. A skill that audits incumbent projects needs the read path — add `document`. |
| R1-3 | **Minor** | No **`pin` shortcut** mechanism (the reference's `/impeccable pin audit` → `/audit`). Add a Shortcuts note to Routing. |
| R1-4 | **Minor** | No **native-platform variants** (audit.native/adapt.native). Accept as scope (web-first data UI), but record the decision — silence reads as an oversight. |
| R1-5 | **Pass** | Commands table, progressive disclosure, registers, craft-floor-before-edit, bounded verification loop — all faithful to the reference's architecture. |
| R1-6 | **Minor** | Reference runs its detector via **hooks**; criterion only mentions running check.mjs manually. Add harness hook wiring guidance. |

## Domain Principal — industry best practices

| # | Sev | Finding |
|---|---|---|
| D1-1 | **Major** | No **intensity axis**. The reference ships `bolder`/`quieter`; data UI needs the *quieter* half badly (alarm-fatigue dashboards). Add `quieter`; omit `bolder` deliberately (register mismatch) and say so. |
| D1-2 | **Minor** | data-display.md lacks **small multiples / sparkline** guidance — the standard cure for overstuffed dashboards. |
| D1-3 | **Pass** | Density-as-feature POV, tabular-figures law, five-states floor, WCAG contrast numbers — all current best practice. |
| D1-4 | **Pass** | `densify`'s fixed order (chrome→redundancy→spacing→type→re-encode) is genuinely better than the reference's generic "amplify". |

## Skill Author — spec & authoring craft

| # | Sev | Finding |
|---|---|---|
| A1-1 | **Minor** | Detector-mapping table references rule names that don't exist in check.mjs (`C2-ish`, `I1`, `S3`) — an agent cross-referencing gets lost. Align to actual rule ids. |
| A1-2 | **Pass** | Frontmatter: name/folder match, description 799/1024 with what+when+not-for, argument-hint, allowed-tools, license — spec-clean. |
| A1-3 | **Pass** | SKILL.md body < 500 lines; reference depth correctly placed in reference/ (progressive disclosure holds). |

## Practitioner — daily use

| # | Sev | Finding |
|---|---|---|
| P1-1 | **Major** | `init` promises DESIGN.md but **ships no template** — first run improvises the format. Add `assets/DESIGN.example.md` as the canonical shape. |
| P1-2 | **Minor** | No before/after demo exists anywhere — the #1 conversion artifact (accepted: launch-phase item, not in-skill debt). |
| P1-3 | **Pass** | Command table and routing are instantly usable; `/criterion densify dashboard` reads like a product. |

## Verdict (Round 1)

Strong pattern fidelity with a real differentiator. Accept R1-1, R1-2, R1-3, R1-6, D1-1, D1-2,
A1-1, P1-1. Reject none. Defer R1-4 (documented scope decision), P1-2 (launch phase).
