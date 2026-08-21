# Three-way expert rating — the Impeccable suite vs pbakaus/impeccable vs UI/UX Pro Max

*Rating date: 2026-08-22. Panel: eight foremost-domain experts. All three subjects measured
live this session (GitHub API, npm registry, fresh clones, hands-on runs). This document
**supersedes `REVIEWS/reference-comparison.md`** (the earlier two-way 8.8/10 capstone, written
before the ten facet launches, the suite tools, and the security red-team).*

**Verdict up front.** On craft, verification, and completeness this suite rates ahead —
**8.1/10** composite vs **7.0/10** for pbakaus/impeccable and **7.2/10** for UI/UX Pro Max.
But the panel is unanimous on the asterisk: the suite's **distribution score is 1.5/10**, and
every other dimension is weighed down by that one. UI/UX Pro Max wins by shipping its craft
to 119,309 people; this suite ships its craft to its own repository. Nothing technical is
lacking that a quarter of go-to-market effort wouldn't fix.

---

## The panel (foremost-domain expertise, persona-framed)

| # | Expert | Rates | Basis of authority |
|---|---|---|---|
| 1 | Design Systems & UI Craft Principal | criterion vs impeccable's core vs uupm's design engine | 15+ years design-systems practice; the data-dense vs persuade-register taxonomy |
| 2 | Software Craft & Code Quality Principal | codecraft, bugcraft, testcraft | Maintainability metrics, refactoring literature |
| 3 | API & Data Platform Principal | apicraft, dbcraft | REST/gRPC/GraphQL versioning, schema evolution in production |
| 4 | Reliability & Delivery Principal | seccraft, obscraft, shipcraft | SRE/DevOps; DORA; the "deploy is a promise" school |
| 5 | Information Retrieval & Data Quality Principal | the search/evals machinery of all three | BM25-era IR, eval methodology (calibration/held-out discipline) |
| 6 | Application Security Principal (OWASP) | security posture of all three | Top 10 + LLM Top 10; supply-chain audit practice |
| 7 | Testing & Behavioral Eval Principal | every harness and test suite | Property-based testing, agent-eval methodology |
| 8 | Skill-Platform & Distribution Analyst | installers, packaging, growth mechanics | The full 2025–26 agent-skills landscape; star-motion analysis |

---

## 1. The measured state (all three, live)

| Measure | This suite | pbakaus/impeccable | UI/UX Pro Max |
|---|---|---|---|
| Stars / forks | 0 / 0 | 61,364 / 3,746 | 119,309 / 12,813 |
| Created | 2026-08 (this project) | 2025-11-16 | 2025-11-30 |
| Repo size | **2.9 MB**, ~500 files | ~2 MB | 29 MB, 790 files |
| Skills | **10** (criterion, codecraft, apicraft, dbcraft, testcraft, perfcraft, seccraft, obscraft, shipcraft, bugcraft) | 1 (design) | 7 (ui-ux-pro-max, design, ui-styling, design-system, brand, banner-design, slides) |
| Command playbooks | **160** across 10 facets | 23, one facet | search-first workflow + priority table (no command set) |
| Reference knowledge | **301 files** (8–9 domains/skill) | 35 reference files | **144 curated CSVs** (192 reasoning profiles, 84 styles, 22 stacks) |
| Deterministic verification | 10 checkers (**79 rule ids**) + 10 decision daemons + 4 gate tools | multi-engine detector (regex, static-html, jsdom, Puppeteer, screenshot-contrast) | 1 advisory token validator (hex → var(--color-*)) |
| Behavioral evals | **341 pinned checks, 11 harnesses**, held-out routing split | 14 test files, suites incl. live skill-behavior on models | **153 Python unit tests** + relevance evals (calibration/held-out) + smoke suites |
| Honesty machinery | honest-empty exits, no-strong-match router, trust-boundary clause ×10 | process prose | **0-result refusal contract** + fallback-labeling rules |
| Security/supply chain | SHA-256-pinned installs (365 files), 64 KB daemon caps + 413s, headers, red-teamed twice | npm v3.6.0, not publicly audited | npm CLI v2.15.0 (17 versions/7 wks), not publicly audited |
| Docs/demos | 10 docs pages + 10 case studies + 10 demos + installer doc | docs + demos | own site (uupm.cc), gallery, **bilingual EN/ZH** |
| Distribution | repo-only; npm package prepared, **unpublished** | npm, Claude plugin marketplace | npm CLI for **12+ harnesses**, marketplace, site, 83 open issues of community |

---

## 2. The three-way scorecard (1–10, with the evidence)

| Dimension | This suite | impeccable | uupm | One-line justification |
|---|---|---|---|---|
| 1. Craft POV & teaching | **8.5** | **9.5** | 5.5 | impeccable's single thesis (craft-floor, bolder/quieter/delight registers) is the most refined in the field; our ten POVs are strong but spread thinner; uupm has checklists, no thesis |
| 2. Vocabulary & playbook depth | **9.0** | 8.0 | 6.5 | 160 commands, every one linked to a reachable playbook (machine-checked); impeccable's 23 are deeper per command; uupm has one workflow |
| 3. Deterministic verification | **9.0** | **8.5** | 3.0 | we verify everything (10 checkers, gates, 341 checks); impeccable verifies visually — screenshot-contrast engine we lack; uupm verifies tokens only |
| 4. Curated data & quality machinery | 8.0 | 4.5 | **9.5** | uupm's 144 CSVs with provenance, font licenses, freshness tests, and eval splits are the class of the field; our prose corpus is gated (data-quality) but unstructured |
| 5. Honesty & anti-fabrication | **8.5** | 6.5 | **9.0** | uupm's 0-result refusal + verify-before-apply is the best tool-enforced honesty anywhere; our honest-empty exits + no-strong-match router + LLM01 trust clauses are close behind |
| 6. Breadth of coverage | **9.5** | 3.5 | 6.5 | ten facets × 8–9 domains vs one facet each for the others; uupm adds 22 UI stacks + brand/slides |
| 7. Behavioral evals & floors | **9.0** | 8.0 | **8.5** | our 341 checks + held-out routing floor; impeccable runs live skill-behavior on real models (we don't); uupm's unit + relevance suites are excellent but engine-scoped |
| 8. Security & supply-chain posture | **9.0** | 6.5 | 5.5 | checksum-pinned installs, capped daemons, headers, two red-teams; the others are unpinned and unaudited |
| 9. Docs, demos, launch completeness | **9.0** | 7.0 | **8.5** | 10 pages + 10 case studies + 10 demos + installer doc; uupm has a public site + gallery; impeccable has docs, no per-facet evidence package |
| 10. Distribution & growth mechanics | **1.5** | 8.0 | **9.5** | the decisive dimension — and ours is the decisive weakness |
| **Composite (mean)** | **8.1** | **7.0** | **7.2** | see the facet-controlled note below |

**Facet-controlled honesty note.** Dimensions 1–3, 6, and 7 reward multi-facet suites.
Restricted to the ONE facet all three share (UI craft), the panel scores: **criterion 8.0**,
**impeccable 9.2** (the still-superior single-facet craft), **uupm 7.0**. The suite's overall
lead comes from completeness, not from beating impeccable at its own game.

---

## 3. Per-panelist verdicts

- **Design Systems Principal — "criterion is the best data-dense craft in the ecosystem;
  impeccable is still the best persuade-register craft; uupm is the best design-system
  *generator*. The suite lacks impeccable's visual-rendered verification and uupm's
  artifact generation — criterion critiques and gates, it doesn't yet *produce* a token
  set or a layout pattern. That's the one feature where a beginner would choose uupm over
  us today."**
- **Software Craft Principal — "codecraft/bugcraft/testcraft have no counterpart in either
  competitor; the evidence-floor and the repro-gate are novel. Missing: live-model evals
  (impeccable runs theirs on real models — our scenarios are synthetic) and a published
  benchmark run against real OSS codebases, which is the only evidence practitioners
  outside this repo will accept."**
- **API & Data Platform Principal — "apicraft's contract-diff and dbcraft's schema-diff +
  migration-review are genuine production-grade gates; the expand/contract wiring to the
  relevance dataset proves the curation loop works. Lacking: machine-readable curated data
  (spec/patterns as structured records) — the router and the gates would both be sharper."**
- **Reliability & Delivery Principal — "shipcraft's ci-check and the ten daemons with caps
  and startup validation are the most defensively-engineered delivery tooling of the
  three. Lacking: nothing mechanical — the missing piece is real-world usage, and a
  cross-facet lifecycle playbook that walks one feature through apicraft→dbcraft→testcraft
  →seccraft→obscraft→shipcraft."**
- **IR & Data Quality Principal — "the uupm search engine is better retrieval (BM25 over
  structured fields with eval splits); our corpus is richer knowledge. The `impc find`
  router with held-out floors is a correct and honest start. Improvement: convert at least
  criterion + apicraft domains to structured records with provenance — this also turns the
  README into countable inventory, which is the distribution problem in disguise."**
- **OWASP Principal — "the only one of the three with a published red-team, pinned
  installs, capped daemons, and LLM01 clauses. Improvement: publish the threat model and
  the checksum policy as SECURITY.md at the repo root so the posture is visible before
  install, and pin third-party references in the docs."**
- **Testing & Eval Principal — "341 checks across 11 harnesses with a frozen held-out
  split is best-in-class methodology for this genre. Lacking: the checks are synthetic
  fixtures; run the checkers against 3–5 public repositories and publish the finding
  tables, then run one agent on real tasks with the skills installed and publish the
  before/after."**
- **Distribution Analyst — "119k stars for uupm is not luck: bilingual README, countable
  inventory in the first screen, 12-harness installer, own website, release automation,
  PR-numbered cadence. This suite has the best product and the worst distribution — 0
  stars, unpublished npm, English-only, no site. Every technical gap below is secondary;
  this is the gap."**

---

## 4. What we are lacking — the improvement ledger (prioritized)

### P0 — credibility & distribution (fix these first; they gate everything else)

| # | Gap | Concrete build | Expected payoff |
|---|---|---|---|
| 1 | **0 stars, unpublished npm** | Publish `impeccable-suite` to npm (package.json, checksums, and the prepublish gate are ready); submit the Claude plugin marketplace listing; add install badges | the first real distribution channel |
| 2 | **No countable-inventory pitch** | Rewrite the README hero: "10 skills · 160 commands · 341 pinned checks · 365 checksummed files · 10 daemons" — uupm's "192 palettes" taught us numbers convert | first-screen conversion |
| 3 | **English-only** | Bilingual README (ZH at minimum) — the single cheapest growth lever uupm pulled | the 119k-star market |
| 4 | **No public evidence** | Run all 10 checkers against 3–5 public OSS repos; publish the finding tables as a benchmark page + a badge | external credibility the synthetic harness can't give |
| 5 | **No live-model evals** | Adapt the scenario harness into a model-run suite (feed each checker's failing fixture to an agent with the skill installed; assert the fix) — impeccable's skill-behavior pattern | closes the "synthetic-only" critique |
| 6 | **No website** | A static page (the docs site already exists — publish it via Pages) with the demo outputs as screenshots | a place for the badge to point to |

### P1 — capability gaps the experts flagged

| # | Gap | Concrete build |
|---|---|---|
| 7 | **Rendered-page verification** (impeccable has screenshot-contrast; we don't) | Add an optional screenshot/contrast probe to criterion's extension (canvas-based, still zero-dependency) or a Playwright-scripted `criterion verify --rendered` |
| 8 | **Generation, not just verification** (uupm generates design systems; we only gate) | `criterion shape --emit-starter`: generate a token set + section pattern from the existing templates into `design-system/MASTER.md`-style files, then gate it with the checker — generation *and* verification |
| 9 | **Structured curated data** (uupm's class-of-field strength) | Convert criterion + apicraft domains to records (CSV/JSON with source + owner fields); feed `impc find`; extend data-quality to validate the records; surface counts in the README |
| 10 | **Cross-facet lifecycle playbook** | One `docs/lifecycle.md`: a feature walked end-to-end through contract → schema → tests → security → observability → delivery, with the handoff artifacts named per facet; wire it into `impc find` |
| 11 | **Harness coverage 5 → 12+** | Extend `impc --ai` targets (roocode, qoder, trae, windsurf, antigravity, copilot, kiro) — the TARGETS map is the only edit; uupm's 12-harness matrix is table stakes |
| 12 | **Criterion native + persuade registers** | criterion lacks impeccable's audit.native/adapt.native depth and bolder/delight/overdrive equivalents — the documented omission on the UI facet |
| 13 | **SECURITY.md + threat model at root** | Publish the red-team results, checksum policy, and daemon threat model (trusted-network note) as a repo-root SECURITY.md |

### P2 — polish & discipline

| # | Gap | Concrete build |
|---|---|---|
| 14 | No release discipline | Tagged releases + CHANGELOG + auto-bump (uupm has CI doing this) |
| 15 | No social proof | Star-history chart, community installs counter, benchmark badge |
| 16 | Harness-side routing | `impc find` as a hook for ambiguous requests (the docs/hooks.md pattern already exists) |

---

## 5. What each competitor still does better than us (explicit)

| Competitor | Still better at | Why it matters |
|---|---|---|
| **pbakaus/impeccable** | Single-facet UI craft depth (9.2 vs criterion's 8.0); rendered-page verification (screenshot contrast); live skill-behavior evals on real models; 61k-star community; published npm | On the one facet it owns, its craft is deeper — and its verification sees pixels, not just text |
| **UI/UX Pro Max** | Curated structured data (144 CSVs + provenance + licenses); artifact generation (design systems, tokens, fonts); 153 unit tests + engine evals; 12-harness CLI; bilingual + website + release automation; 119k stars | The data engine and the distribution machine — everything in P0/P1 items 3, 6, 9, 11, 14 |

**What we alone have** (no competitor has): ten facets with a named POV each; 10 decision
daemons with caps, headers, and startup validation; SHA-256-pinned installs; a corpus
integrity gate that found and fixed 15 real curation gaps on its first run; LLM01
trust-boundary clauses in every skill; two published security red-teams; 10 docs pages +
10 case studies + 10 demos; and a held-out routing-eval split.

---

## 6. Final verdict

**Rated 8.1/10 against the field — first on craft, verification, security, and completeness;
last on distribution.** The panel's closing sentence: *"This is the most completely
engineered craft-skill suite in the ecosystem, and the least distributed one. The gap
between the product and its packaging is the entire story. Fix the ledger's P0 row —
publish, count, translate, evidence — and the 1.5 becomes the only dimension the other
two still own."*

*Supersedes `REVIEWS/reference-comparison.md` (two-way, 8.8/10, pre-launch). Next rating:
after the P0 ledger ships.*
