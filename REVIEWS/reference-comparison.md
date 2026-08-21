# Capstone review: the suite vs the reference Impeccable skill

> **Superseded (2026-08-22)** by [experts-rating-2026-08.md](experts-rating-2026-08.md) — the
> three-way panel rating against both pbakaus/impeccable and UI/UX Pro Max, written after the
> ten facet launches, the suite tools, and the security red-team. Kept for its playbook-by-
> playbook mapping, which the new rating builds on.

**Panel:** Reference Keeper (pbakaus/impeccable expert) · Suite Architect · Domain Principal
(across 10 facets) · Benchmark Methodologist.
**Basis of comparison:** pbakaus/impeccable at v4.x, August 2026 — 61.1k stars, 3.7k forks,
1,558 commits; README, SKILL.src.md, plugin.json, and the skill/reference tree as of this
session's fetches. **Subject:** this repository's 10-skill suite at its post-review state.

## 1. The reference, inventoried (what we measure against)

| Capability | Impeccable (the reference) |
|---|---|
| Skill count | **1** (design only) |
| Command playbooks | **23** (craft, shape, init, document, extract, critique, audit, polish, bolder, quieter, distill, harden, onboard, animate, colorize, typeset, layout, delight, overdrive, clarify, adapt, optimize, live) |
| Domain knowledge | **7** references (typography, color & contrast, spatial, motion, interaction, responsive, UX writing) |
| Quality floor | craft-floor.md (floor + absolute bans + reflexes) |
| Anti-patterns | **59 deterministic rules** + LLM critique pass |
| Detector surface | CLI **and** browser extension (no LLM, no API key) |
| Iteration | `live`: browser-based visual variant mode with a decision-page daemon |
| Context flow | PRODUCT.md + DESIGN.md + per-surface briefs, loaded by a `context.mjs` setup script |
| Registers | 4 modes (Persuade, Operate, Read, Experience) |
| Platform depth | Native variants (audit.native, adapt.native — iOS/Android) |
| Automation | Hooks (design-detector hook manager) |
| Packaging | 17+ agent folders, Claude plugin, npm CLI, skills-lock |
| Quality assurance | Skill-behavior scenarios pinned and tested live on models |
| Launch artifacts | Docs site, demos, case studies |

## 2. The suite, inventoried (what this repo ships)

| Capability | This suite |
|---|---|
| Skill count | **10** — one per facet: criterion (UI/UX), codecraft (code), apicraft (API), dbcraft (database), testcraft (testing), perfcraft (performance), seccraft (security), obscraft (observability), shipcraft (DevOps/CI-CD), bugcraft (debugging) |
| Command playbooks | **153** (criterion 22 · codecraft 15 · apicraft 14 · dbcraft 14 · testcraft 14 · perfcraft 15 · seccraft 14 · obscraft 15 · shipcraft 15 · bugcraft 15) |
| Domain knowledge | **81 files** — 8–9 per skill, each with a named differentiator domain |
| Quality floors | **10** (one per facet, numeric where the domain allows) |
| Anti-patterns | **~200 tells** (20 per skill), each with the fix, mapped to checker rule ids |
| Detector surface | **10 deterministic checkers, 91 rule ids**, zero dependencies, `--strict`/`--json`/exit codes |
| Iteration | criterion `live` (prompt-based variants); the bounded verification loop in every skill |
| Context flow | 10 `init` commands writing PRODUCT/DESIGN/DATA/API/TESTS/PERF/SECURITY/OBSERVABILITY/SHIP/DEBUG context files from **16 shipped templates** |
| Registers | Criterion's 4 (Command/Configure/Record/Convince) + facet-native registers elsewhere |
| Platform depth | Web-first (documented scope decision); native guidance via domain principles |
| Automation | docs/hooks.md (PostToolUse/CI wiring for all checkers) |
| Packaging | `npx skills add` + `.claude-plugin/plugin.json` (v1.0.0), Apache-2.0 |
| Quality assurance | **21-document two-round expert review program** (4 personas incl. adversarial red-team) |
| Launch artifacts | Not yet (roadmap) |

## 3. The core completeness test: playbook-by-playbook mapping

Every one of the reference's 23 command playbooks, mapped against the suite:

| Reference command | Suite coverage | Verdict |
|---|---|---|
| `craft` | criterion: routing default + `new-work.md` | ✅ Equivalent (deprecated in the reference too) |
| `shape` | criterion `shape` | ✅ Direct |
| `init` | criterion `init` — plus 9 sibling inits (one per facet) | ✅ Direct, ×10 |
| `document` | criterion `document` | ✅ Direct |
| `extract` | criterion `extract` (+ codecraft/dbcraft extract) | ✅ Direct |
| `critique` | criterion `critique` | ✅ Direct |
| `audit` | criterion `audit` (native variant: documented out-of-scope) | ✅ Direct (web) |
| `polish` | criterion `polish` | ✅ Direct |
| `bolder` | Deliberate omission — documented in Scope notes | ⚖ Justified: amplification is the disease in task UI; `densify`/`quieter` replace |
| `quieter` | criterion `quieter` | ✅ Direct |
| `distill` | criterion `distill` | ✅ Direct |
| `harden` | criterion `harden` — plus harden in **all 9 other skills** | ✅ Direct, ×10 |
| `onboard` | criterion `onboard` | ✅ Direct |
| `animate` | criterion `animate` | ✅ Direct |
| `colorize` | criterion `colorize` (**added during this capstone pass**) | ✅ Direct |
| `typeset` | criterion `typeset` | ✅ Direct |
| `layout` | criterion `align` (same job: spacing, rhythm, hierarchy) | ✅ Renamed equivalent |
| `delight` | Deliberate omission — now documented in Scope notes | ⚖ Justified: `animate`/`onboard`/`live` are the tool-UI replacements |
| `overdrive` | Deliberate omission — now documented in Scope notes | ⚖ Justified: extraordinary effects belong to marketing/Experience registers |
| `clarify` | criterion `clarify` | ✅ Direct |
| `adapt` | criterion `adapt` (native variant: documented out-of-scope) | ✅ Direct (web) |
| `optimize` | criterion `optimize` (+ perfcraft `optimize`) | ✅ Direct |
| `live` | criterion `live` (prompt-based; no decision-page daemon) | ✅ Direct (lighter tooling) |

**Result: 23/23 accounted — 19 direct/renamed, 1 routing-equivalent, 3 justified omissions,
0 unexplained gaps.** The one previously-unexplained gap (colorize) was closed in this pass.

## 4. Domain knowledge mapping (the reference's 7 → the suite's 81)

| Reference domain | Suite coverage |
|---|---|
| typography | criterion `typography` (tabular figures, functional scale) — deeper for data UI |
| color & contrast | criterion `color` (semantic tokens, tinted neutrals, WCAG pairs) |
| spatial design | criterion `spatial` (density tiers, the 4px grid, fold-as-decision) |
| motion design | criterion `motion` (comprehension jobs, the timing table, reduced motion) |
| interaction design | criterion `interaction` (forms, focus, the tool triad) |
| responsive design | criterion `adapt` + `accessibility` (column priority, 320px class) |
| ux writing | criterion `ux-writing` + `clarify` |
| *— (no reference equivalent)* | criterion `data-display` (tables/charts/dashboards) + `accessibility` as first-class |

Plus 73 domain files across nine facets the reference does not attempt (code, APIs, data, tests,
performance, security, observability, delivery, debugging) — each facet also carrying a named
*differentiator* domain (evidence, trust, telemetry, pipelines, measurement…).

## 5. Machinery mapping

| Mechanism | Reference | Suite | Rating |
|---|---|---|---|
| Setup context | `context.mjs` script loads PRODUCT/DESIGN/surface briefs | init/document + 16 shipped templates (LLM-driven) | Partial (ours is less scripted, more portable) |
| Quality floor | 1 craft-floor | 10 floors, numeric where measurable | Stronger |
| Anti-patterns | 59 design rules | 91 checker rule ids + ~200 tells | Broader, shallower per facet |
| Detector | CLI + browser extension | 10 CLIs, no extension | Parity-minus (extension on roadmap) |
| Hooks | hook manager | docs/hooks.md for all checkers | Equivalent |
| Live iteration | decision-page daemon | prompt-based bounded rounds | Lighter |
| Native platforms | audit.native / adapt.native | documented out-of-scope | Gap (roadmap) |
| Packaging | 17+ folders + plugin + lock | npx skills + plugin.json + CLI lockfiles | Equivalent-leaner |
| Behavioral evals | scenario-pinned, live-tested | two-round expert program + adversarial checker tests | Parity-minus (no automated harness) |
| Docs/demos/cases | site, demos, case studies | — | Gap (launch phase) |

## 6. Best-practice registry (what the suite accounts for, by name)

| Facet | Standards encoded |
|---|---|
| UI/UX | WCAG 2.x contrast & target sizes, WCAG-AA, reduced-motion, tinted-neutrals/OKLCH, tabular figures, density tiers |
| Code | Sonar cognitive complexity, rule-of-three/AHA, command-query separation, state machines over flags, naming-as-claims |
| API | RFC 9457 Problem Details, RFC 6750 bearer, Idempotency-Key, cursor pagination, Deprecation/Sunset draft RFC, OpenAPI + spec-diff CI, HMAC webhook signing + replay windows |
| Database | Postgres RLS, expand/contract migrations (Fowler), partial unique indexes, NUMERIC money, keyset pagination, EXPLAIN-driven indexing |
| Testing | Property-based testing (Hypothesis/fast-check), mutation testing, characterization tests, Testcontainers, flake taxonomy |
| Performance | Core Web Vitals + LCP sub-part attribution, P50/P95/P99 doctrine, flame-graph attribution, scheduler.yield, backoff+jitter, budget gates |
| Security | OWASP ASVS/CWE anchors, argon2id/bcrypt, AES-GCM, CSP, SRI, CSRF triple, SSRF allowlists, secret lifecycle + SBOM |
| Observability | OpenTelemetry semantic conventions, SLO/error budgets (Google SRE), multi-window burn-rate alerting, exemplars, cardinality budgets |
| DevOps | DORA 4 keys, 12-factor, IaC drift detection, digest-pinned artifacts, concurrency groups, rehearsed rollback |
| Debugging | git bisect run, record/replay (rr/TTD), delta-debugging minimization, regression pins, blameless postmortems |

## 7. Scorecard

| Dimension | Score | Evidence |
|---|---|---|
| **Pattern fidelity** (the Impeccable formula reproduced) | **9.5/10** | Commands+domains+floor+anti-patterns+checker+packaging replicated ×10; only scripted-context and daemon-level tooling not duplicated |
| **Playbook completeness** (within the reference's own design facet) | **9.0/10** | 23/23 accounted (19 direct + 1 routing + 3 justified); native variants absent; `live` lighter |
| **All-encompassingness** (coverage beyond the reference) | **9.5/10** | 10 facets spanning the SDLC; residual: requirements/product mgmt, native mobile, embedded |
| **Best-practice accounting** | **9.0/10** | Registry above — every facet names the industry standard it encodes |
| **Deterministic verification** | **8.0/10** | 91 rules across 10 checkers vs 59 in one; no browser extension; per-facet design depth below the reference |
| **Operational maturity** | **7.5/10** | Spec-clean, plugin, hooks, templates, 21-doc review archive; missing docs site, demos, case studies, automated evals |
| **Overall** | **8.8/10** | — |

## 8. Gap ledger

| Gap | Disposition |
|---|---|
| `colorize` playbook missing | **Closed this pass** — command added, all 23 now accounted |
| `delight`/`overdrive` omissions undocumented | **Closed this pass** — rationale written into Scope notes |
| Browser extension | Roadmap (launch phase) |
| `live` decision-page daemon | Roadmap (launch phase) |
| Native platform variants | Documented scope decision; roadmap |
| Docs site, demos, case studies | Roadmap (launch phase — the reference's #1 conversion driver) |
| Automated behavioral evals | Roadmap (scenario harness for the 10 checkers) |
| Requirements/product facet | Considered; out of scope by design (that facet is `shape`+`init` territory, already covered per skill) |

## 9. Verdict

On the reference's own axis — design craft — the suite accounts for **all 23 playbooks and all 7
domains** (19 direct, 4 justified-by-design), with the only unclosed item being tooling depth
(extension, live daemon, native variants). On the axis that matters to the original goal, the
suite is the **all-encompassing superset**: the reference is one facet of ten; the suite extends
the identical formula — commands, domains, floor, anti-pattern tells, deterministic checker,
packaging — across the full software lifecycle, adds cross-skill doctrine the reference cannot
have (apicraft's errors referenced by seccraft and bugcraft; dbcraft's migrations referenced by
shipcraft and bugcraft; testcraft's determinism referenced by shipcraft's autom), and has run
every facet through two rounds of multi-persona expert review including adversarial checker
testing.

**Rated: 8.8/10 — parity-plus on pattern, parity-minus on single-facet tooling depth, and
unmatched on scope.** The remaining deltas are all launch-phase items, not knowledge gaps.
