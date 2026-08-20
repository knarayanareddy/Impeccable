# Review: codecraft (code quality) — Round 1

**Panel:** Reference Keeper (pbakaus/impeccable expert) · Domain Principal (staff engineer) ·
Skill Author (Agent Skills spec craft) · Practitioner (daily user)

## Reference Keeper — pattern fidelity vs the reference repo

| # | Sev | Finding |
|---|---|---|
| R1-1 | **Minor** | No **`pin` shortcut** mechanism — add the Shortcuts routing note (same as criterion's fix). |
| R1-2 | **Minor** | No **hooks wiring** — Setup mentions running check.mjs manually; add the harness-hook step pointing at `docs/hooks.md`. |
| R1-3 | **Major** | **Hardcoded quality floor.** The reference persists project context (PRODUCT.md/DESIGN.md) so commands adapt to the project; codecraft's ceilings (30 lines, depth 3, 600-line files) are global constants. Best practice: a tunable `.codecraft.json` (or CODEBASE.md fields) that init writes and the floor reads. |
| R1-4 | **Pass** | Commands table, progressive disclosure, craft-floor-before-edit, bounded verification — faithful. |
| R1-5 | **Pass** | Cross-language scope (idioms domain) is a *wider* net than the reference — a real differentiator, not a gap. |

## Domain Principal — industry best practices

| # | Sev | Finding |
|---|---|---|
| D1-1 | **Major** | **No state-and-mutability domain.** Modern code-quality consensus (immutable-by-default, mutation scope, null/optional handling) is scattered across functions/errors with no home. Add `domains/state.md` and wire it from the floor and errors. |
| D1-2 | **Minor** | Complexity domain references "cognitive load" loosely — cite the industry metric (SonarSource cognitive complexity) and its thresholds so `measure` can use it. |
| D1-3 | **Pass** | Rule of three, AHA programming, naming-as-claims, command/query separation — all current. |
| D1-4 | **Pass** | `simplify`'s fixed order (delete → derive → types → extract → flatten) is stronger than generic "refactor" guidance. |

## Skill Author — spec & authoring craft

| # | Sev | Finding |
|---|---|---|
| A1-1 | **Minor** | `vague-name` only inspects function signatures — record that limitation in the detector mapping so agents don't over-trust it (extending to all variable declarations has too many false-positive windows). |
| A1-2 | **Pass** | Frontmatter spec-clean; SKILL.md body < 500 lines; reference depth correctly placed. |
| A1-3 | **Pass** | Checker exit codes, `--strict`, `--json`, gcd-based indent detection — authoring quality above the reference's own detector docs. |

## Practitioner — daily use

| # | Sev | Finding |
|---|---|---|
| P1-1 | **Major** | `init` writes CODEBASE.md with **no template shipped** — first run improvises. Add `assets/CODEBASE.example.md`. |
| P1-2 | **Minor** | The tunable floor (R1-3) needs an example config shipped — `assets/codecraft.config.example.json`. |
| P1-3 | **Pass** | `/codecraft review src/api` and `simplify` read like a product. |

## Verdict (Round 1)

Accept R1-1, R1-2, R1-3, D1-1, D1-2, A1-1, P1-1, P1-2. Reject none.
