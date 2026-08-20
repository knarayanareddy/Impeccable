# Criterion

**The design skill for interfaces that do work.** Dashboards, admin panels, internal tools, analytics,
data tables, charts, filters, forms, settings — surfaces where a person shows up with a job to finish,
eight hours a day.

> Impeccable made AI care about design for *pages that persuade*. Criterion is the same play, for the
> surfaces where most professional frontend work actually happens: **data-dense, task-focused product
> UI** — and its quality bar is measurable, not vibes.

```
Design for the second hour, not the first impression.
Measure, don't vibe.
```

## Why Criterion?

AI coding tools generate the same "tool-slop" on every product UI: marketing gradients on dashboards,
cards inside cards, gray text that fails contrast, airy spacing that pushes data below the fold, pies
for comparisons, spinners for sub-second saves, and tables with no empty state. Criterion fixes the
model's baseline for these surfaces — before the code is generated, not after.

| | Criterion gives your agent |
|---|---|
| 🎯 | **One register:** Command (task) UI, plus Configure, Record, Convince — chosen per surface |
| 🧭 | **18 commands** — a shared vocabulary: `/criterion audit`, `densify`, `measure`, `benchmark`, `polish`, `harden`… |
| 📚 | **8 domain references** — typography, color, spatial, motion, interaction, **data display (tables/charts/dashboards)**, UX writing, accessibility |
| 📏 | **A numeric craft floor** — contrast ≥4.5:1, 4px grid, 44px targets, tabular figures, 5 mandatory states |
| 🚫 | **20 anti-pattern bans** — the tool-slop tells, each with the fix |
| ⚙️ | **A deterministic checker** — `scripts/check.mjs`, zero dependencies, no LLM, no API key |

## Quick start

```bash
# From your project root — auto-detects your agent (Claude Code, Cursor, Codex, …)
npx skills add knarayanareddy/Impeccable --skill criterion

# Claude Code (plugin marketplace)
/plugin marketplace add knarayanareddy/Impeccable
```

Then, inside your AI coding tool:

```
/criterion init                 # capture product context once per project
/criterion shape ticket-detail  # plan UX before code
/criterion densify dashboard    # raise information per viewport, without clutter
/criterion audit tickets        # a11y, contrast, perf, responsive — ranked punch list
/criterion polish settings      # the final pre-ship pass
```

Manual install: copy the `skill/criterion/` folder into your agent's skills directory
(`.claude/skills/`, `.cursor/skills/`, `.agents/skills/`, `.gemini/skills/`, …).

## The commands

| Category | Commands |
|---|---|
| Build | `init` · `shape [feature]` · `extract [target]` |
| Evaluate | `audit [target]` · `critique [target]` · `measure [target]` · `benchmark [target]` |
| Refine | `polish` · `densify` · `distill` · `align` · `typeset` · `harden` |
| Enhance | `animate` · `clarify` · `adapt` · `optimize` · `onboard` |

Signature moves you won't find elsewhere:

- **`densify`** — the anti-marketing pass: more information per viewport *with* better scanability,
  in a fixed order (chrome → redundancy → spacing → type → re-encoding).
- **`measure`** — a quantitative report: contrast ratios, grid adherence, above-the-fold counts,
  target sizes, state coverage, motion durations. Numbers, not adjectives.
- **`benchmark`** — steal the *mechanisms* of category leaders (row height, filter patterns, empty
  states), never their pixels.

## The checker

Every pass ends with a machine-verifiable artifact:

```bash
node skill/criterion/scripts/check.mjs --target src/
# ERROR  pure-black            Table.tsx:142  Pure black (#000)…
# ERROR  elastic-easing        theme.css:31   bounce/elastic easing…
# WARN   banned-font           globals.css:9  Inter as a silent default…
# criterion: 14 file(s) scanned · 2 error(s), 1 warning(s) · FAILED
```

Detects: banned default fonts · pure black · low-contrast grays · gray-on-color · radius ≥16px on data
regions · purple→blue gradients · elastic/bounce easing · `transition: all` · >500ms feedback motion ·
`<blink>`/`<marquee>`. Zero dependencies — runs anywhere Node runs.

## How it compares

| Skill | Best at | Criterion's edge |
|---|---|---|
| anthropics/frontend-design | Distinct visual identity per brief | — |
| pbakaus/impeccable | Design vocabulary for pages that persuade | Criterion owns the **Operate register**: density as a feature, measurable quality floor, data-display domain |
| Leonxlnx/taste-skill | Tunable variance/motion/density for landings | Product UI doesn't need dials — it needs a floor |
| nutlope/hallmark | Anti-slop pages, DNA extraction | Same rigor, aimed at tools and data, not pages |

## Structure

```
skill/criterion/
├── SKILL.md              # the skill: persona, principles, registers, command table
├── scripts/
│   └── check.mjs         # deterministic anti-pattern checker (zero deps)
└── reference/
    ├── craft-floor.md    # the numeric quality floor — loaded before every edit
    ├── new-work.md       # starting a new surface / replacement world
    ├── anti-patterns.md  # 20 tool-slop tells, each with the fix
    ├── domains/          # typography · color · spatial · motion · interaction
    │                     #   · data-display · ux-writing · accessibility
    └── commands/         # one playbook per command (18)
```

See [`RESEARCH.md`](RESEARCH.md) for the full market research, why this angle was chosen, and the
go-to-market playbook.

## License

Apache-2.0. Original work — not affiliated with pbakaus/impeccable.
