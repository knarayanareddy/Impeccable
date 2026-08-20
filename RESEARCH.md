# Research: Why Impeccable Trends, and How to Build a Skill That Can Too

_Extensive market research, August 2026. Companion to the `criterion` skill in this repo._

---

## 1. Executive summary

**Impeccable** (pbakaus/impeccable, ~61k stars) is the reference "design skill" for AI coding agents.
It trended because it packaged a *shared design vocabulary* (23 slash-commands + 7 domain references +
curated anti-pattern bans + deterministic detectors) into a one-line-installable skill that fixes the
single most visible failure mode of AI-generated frontends: **generic "slop" UI**.

The Agent Skills format it uses is now an open standard (`SKILL.md` + YAML frontmatter + progressive
disclosure via `reference/` files), with a distribution ecosystem (`npx skills add`, plugin marketplaces,
skill directories).

**Conclusion of this research:** a clone of Impeccable cannot trend — the top of the market is taken by
general-purpose anti-slop skills (Impeccable, taste-skill, hallmark, ui-ux-pro-max). The open white space
is **data-dense, task-focused product UI** (dashboards, admin panels, internal tools, tables, charts,
forms). Nobody owns that register. That is the angle this repo ships as: **`criterion`**.

---

## 2. What Impeccable is (deconstructed)

Created by Paul Bakaus (creator of jQuery UI), built on top of Anthropic's `frontend-design` skill.

| Component | What it does |
|---|---|
| **1 skill, 23 commands** | `polish`, `audit`, `critique`, `distill`, `animate`, `bolder`, `quieter`, `overdrive`, ... accessed via `/impeccable <command> <target>`. A shared vocabulary so users can ask for "vertical rhythm" without knowing the term. |
| **7 domain references** | typography, color & contrast, spatial design, motion, interaction, responsive, UX writing. Loaded per command. |
| **Anti-pattern bans** | No Inter/Roboto/Arial defaults, no gray-on-colored-backgrounds, no pure black, no cards-in-cards, no bounce/elastic easing, no rounded-icon-tile-above-every-heading. |
| **Brand vs product register** | 4 visitor modes: Persuade (marketing), Operate (task), Read (docs), Experience (portfolio). |
| **Deterministic detector** | 59 rules run by CLI/browser extension **without an LLM or API key** — tangible verification, not vibes. |
| **Setup flow** | `/impeccable init` writes `PRODUCT.md` + `DESIGN.md` project context that every later command reads. |
| **Live mode** | browser-based visual variant iteration on elements. |
| **Distribution** | `npx skills add pbakaus/impeccable`, `/plugin marketplace add pbakaus/impeccable`, multi-agent folders (`.claude`, `.cursor`, `.codex`, `.gemini`, `.kiro`, `.trae`, ...), docs site (impeccable.style), before/after case studies. |

### Why it trended (the mechanics)

1. **It fixes a universally-experienced pain.** Every AI coding tool emits the same tells: Inter font,
   purple→blue gradients, nested cards, gray text on colored backgrounds. The skill changes the model's
   *reference distribution* rather than patching output downstream.
2. **Zero-friction install + instant payoff.** One terminal command, then `/impeccable polish` visibly
   upgrades a page in one pass.
3. **Deterministic verification.** The 59-rule detector gives users something to *run and see pass* —
   converts a fuzzy aesthetic claim into a measurable artifact.
4. **Cross-agent portability.** The open SKILL.md format means one skill works in Claude Code, Cursor,
   Codex, Gemini CLI, Copilot, etc.
5. **Strong founder signal + Apache 2.0 + active development.** 1,500+ commits, case studies, docs site.
   Reached ~10k stars in under 4 months, then ~44k–61k.

---

## 3. The Agent Skills standard (what we must comply with)

Source: [agentskills.io/specification](https://agentskills.io/specification) (open spec).

```
skill-name/            # folder name == frontmatter `name`
├── SKILL.md           # REQUIRED. YAML frontmatter + Markdown body
├── scripts/           # optional executables the agent runs
├── reference/         # optional docs loaded on demand (progressive disclosure)
└── assets/            # optional templates, images, fonts
```

**Frontmatter constraints:**

| Field | Required | Rules |
|---|---|---|
| `name` | yes | ≤64 chars, lowercase a–z/0–9/hyphens, no leading/trailing/consecutive hyphens, **must match folder name** |
| `description` | yes | ≤1024 chars; states **what it does AND when to use it** (it is the agent's trigger condition, not marketing copy) |
| `license` | no | SPDX id or bundled file reference |
| `compatibility` | no | ≤500 chars, environment needs |
| `metadata` | no | string→string map |
| `allowed-tools` | no (experimental) | pre-approved tools, e.g. `Bash(node scripts/*.mjs)` |

**The 3-tier loading model (why structure matters):**
1. *Catalog:* every skill's name + description (~50–100 tokens each) is always in context → the
   description must win activation against competitors.
2. *Activation:* full SKILL.md body loads when the task matches → keep body <500 lines / ~5k tokens.
3. *Execution:* reference files/scripts load only when named → put depth there, not in SKILL.md.

**Distribution channels found in research:**
- `npx skills add <owner>/<repo>` / `--skill <name>` / `--agent <target>` (skills CLI, works across agents)
- Claude Code plugin marketplace: `.claude-plugin/plugin.json` + `skills` path
- Skills directories/indexes: skills.sh, explainx.ai, aiuxplayground.com, ui-skills.com, awesomeskill.ai,
  claudeskills.info, agentskills.io, agensi.io — most scrape GitHub automatically (≥2 stars), several
  accept submissions

---

## 4. Competitive landscape (August 2026)

| Skill | Stars (approx.) | Angle | Strengths | Gaps |
|---|---|---|---|---|
| anthropics/**frontend-design** | (inside 171k repo) | Distinctive visual identity per brief | Baseline everyone builds on; persona-driven | No commands, no detectors, marketing-leaning |
| pbakaus/**impeccable** | ~61k | Design language + 23 commands + detectors | Vocabulary, verification, brand/product registers | Operate/product-UI depth is thin vs its marketing heart; huge surface to maintain |
| Leonxlnx/**taste-skill** | ~59–68k | 3 "dials" (variance, motion, density) + presets | Tunable like an equalizer; 11 variants | Landing pages/portfolios/redesigns; little data-dense UI guidance |
| nutlope/**hallmark** | ~13k | 3 verbs (audit/redesign/study) + honest-copy rule | DNA extraction from screenshots/URLs; strict verification at 4 widths | Page-focused, not tool-focused |
| nextlevelbuilder/**ui-ux-pro-max** | ~102k | 161 reasoning rules + 67 UI styles + DS generator | Breadth | Kitchen-sink breadth; no sharp POV |
| oso95/**scroll-world** | ~7.2k | Scroll-driven 3D brand worlds | Novelty | Narrow; experiential marketing only |

**The white space:** every major skill optimizes for *pages that persuade* (landings, marketing,
portfolios, editorial). Real-world frontend work is dominated by *interfaces that operate*: dashboards,
admin, internal tools, analytics, tables, charts, filters, forms. Impeccable has an Operate register but
its energy, commands (`bolder`, `delight`, `overdrive`), and detector rules skew marketing. Data-dense UI
has different physics — density is a feature, decoration is a liability, and quality is *measurable*
(contrast, alignment, row height, visible columns, tabular figures). **That measurability is the hook:
"measure, don't vibe" is an ownable POV nobody else claims.**

---

## 5. What this repo ships (design decisions)

### `criterion` — the design skill for interfaces that do work

| Decision | Rationale |
|---|---|
| **Angle: data-dense, task-focused UI** | Only unclaimed register; matches where professional hours are actually spent |
| **POV: "Design for the second hour, not the first impression. Measure, don't vibe."** | Sharp, ownable, the opposite energy of `bolder`/`delight`; measurable = verifiable = shareable |
| **18 commands** | Own vocabulary: `audit`, `critique`, `measure`, `benchmark` (evaluate) / `densify` (the anti-Impeccable command), `distill`, `align`, `typeset`, `harden`, `polish` (refine) / `animate`, `clarify`, `adapt`, `optimize`, `onboard` (enhance) / `init`, `shape`, `extract` (build) |
| **8 domain references incl. data-display** | Typography, color, spatial, motion, interaction, **data-display (tables/charts/dashboards)**, ux-writing, accessibility — data-display is the differentiator file |
| **`craft-floor.md`** | Numeric quality floor loaded before any edit (contrast ratios, 4/8px grid, 44px targets, tabular figures, 5 mandatory states) |
| **`anti-patterns.md`** | 20 deterministic "tool-slop" tells specific to product UI, mapped to the checker |
| **`scripts/check.mjs`** | Zero-dependency deterministic detector (the Impeccable play, done for product UI): banned fonts, pure black, low-contrast grays, oversized radius, elastic easing, purple-blue gradients, `transition: all` |
| **4 registers** | Command (default), Configure, Record, Convince — chosen per surface, not per product |
| **Portable-first** | Entire skill (incl. scripts) lives in one folder → works with `npx skills add`, plugin marketplace, or manual copy |

### Why not a clone

- Impeccable is Apache-2.0, so a fork is legal — but pointless for trending. The stars went to the
  *category invention*, not the content.
- taste-skill proves the playbook repeats when the angle is distinct (equalizer-dials vs vocabulary).
- Criterion's differentiation is compound: different register (operate vs persuade), different POV
  (measure vs embellish), different command set (`densify` instead of `bolder`), different reference
  (data-display domain), different detector targets (data-density tells vs marketing tells).

---

## 6. Go-to-market checklist (patterns extracted from the winners)

1. **One-line install in the README hero.** `npx skills add <owner>/<repo> --skill criterion`.
2. **Before/after evidence.** Generate a real case (e.g., a generic AI dashboard → Criterion pass) and
   screenshot it. Every trending skill has a visible transformation.
3. **Deterministic checker front and center.** "Run `check.mjs`, watch the violations disappear" —
   converts aesthetics into a pass/fail artifact people screenshot and share.
4. **Cross-agent install folders.** Add `.claude-plugin/plugin.json` (done) and let `npx skills` handle
   the rest; optionally add `.cursor/`, `.codex/`, `.gemini/` shims later.
5. **Submit to directories that amplify:** skills.sh, aiuxplayground.com, ui-skills.com,
   claudeskills.info, agensi.io, awesome lists (awesome-claude-design, awesome-agent-skills).
6. **Ship a docs/demo page** (GitHub Pages) with the command reference rendered — impeccable.style is a
   major conversion driver.
7. **Public launch channels:** dev.to / Hacker News ("Why every AI dashboard looks the same"), r/ClaudeCode,
   X. The niche angle ("the only design skill for dashboards and tools") is the headline.
8. **Keep the repo active.** The winners commit near-daily; stars cluster on velocity.

### Future roadmap (v0.2+)

- Browser extension running `check.mjs` rules on any page (Impeccable's extension, for product UI)
- `live`-style visual variant mode for table/dashboard components
- `DESIGN.md`/`PRODUCT.md` context flow in `init` (adopted from Impeccable's proven pattern)
- Density presets (compact/comfortable/airy) as first-class tokens
- Before/after demo: generic AI dashboard → Criterion dashboard

---

## 7. Sources

- [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (README, SKILL.src.md, plugin.json, reference/)
- [agentskills.io/specification](https://agentskills.io/specification) — Agent Skills open spec
- [anthropics/skills — frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), [nutlope/hallmark](https://github.com/nutlope/hallmark),
  [nextlevelbuilder/ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max), [oso95/scroll-world](https://github.com/oso95/scroll-world)
- [impeccable.style](https://impeccable.style/), [aiuxplayground.com/skills/impeccable](https://aiuxplayground.com/skills/impeccable/),
  [ui-skills.com](https://www.ui-skills.com/skills/pbakaus/impeccable)
- [dev.to — Stop Your AI Coding Tool from Generating Generic UI](https://dev.to/_46ea277e677b888e0cd13/stop-your-ai-coding-tool-from-generating-generic-ui-impeccable-design-skill-4g1l)
- [abduzeedo.com — Impeccable: The Open-Source AI Design Skill for Better UI](https://abduzeedo.com/impeccable-open-source-ai-design-skill-better-ui)
- [pasqualepillitteri.it — The 20 Best Claude Code Skills for UI/UX Design](https://pasqualepillitteri.it/en/news/576/claude-code-skills-design-uiux-guide)
- [agensi.io — 7 AI Agent Skills Marketplaces in 2026](https://www.agensi.io/learn/best-ai-agent-skills-marketplaces-2026)
- [silenceper.com — What GitHub Trending Says About AI Agents](https://silenceper.com/en/article/2026-05-27-github-trending-agent-skills-engineering/)
- [vercel-labs skills CLI guides](https://www.jacklandrin.com/ai%20agent/2026/03/14/skills-cli-guide-using-npx-skills-to-supercharge-your-ai-agents.html), [nvidia/skills](https://github.com/nvidia/skills)
