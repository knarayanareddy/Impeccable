# Anti-patterns: the tool-slop tells

The patterns below are the tell-tale fingerprints of an AI (or lazy template) that has only ever seen
marketing pages. Every one of them is a defect in the Command and Configure registers. Most have a
deterministic detector rule in `scripts/check.mjs` — see the rule ids.

## Typography tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| T1 | Inter (or Roboto/Arial/Open Sans) as a silent default | The single strongest "AI generated" signal; also, most data UI benefits from type with stronger figures | Choose deliberately: a functional workhorse (IBM Plex Sans, Public Sans, Source Sans 3, Inter *if chosen for a reason* — state it) |
| T2 | Proportional figures in data | `1,250` vs `1,111` — columns don't compare | `font-variant-numeric: tabular-nums` on every data value |
| T3 | Units repeated in every cell (`$12.00`, `$8.50`…) | Noise; kills scanability | Unit in the header or label, once |
| T4 | Heading fonts >24px for section titles in tools | Eats the fold; hierarchy by shouting | 14–20px titles with weight and spacing, not size, doing hierarchy |
| T5 | ALL-CAPS eyebrows everywhere | Marketing habit; adds noise in tools | Real labels ("Filters", "Open tickets") or nothing |

## Color tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| C1 | Purple→blue gradients in product UI | Category-level AI fingerprint | Solid tinted surfaces; color only where it encodes meaning |
| C2 | Gray-on-color text | Almost always fails contrast; feels broken | Tint the gray toward the surface hue and check 4.5:1 |
| C3 | Pure black or pure gray | Dead, printer-like; poor on OLED dark modes | Tinted near-black (`#18181b`-family hue-tinted) |
| C4 | Badge rainbow: 6+ status colors | Status stops meaning anything past ~4 | 4 max: danger, warn, success, info — plus neutral |
| C5 | Accent color used as decoration | Dilutes what "accent = actionable/selected" means | Reserve accent for the active, selected, or primary action |

## Structure tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| S1 | Cards inside cards | Elevation soup; three borders to find one number | One container per region; hairlines or contrast, not nested shadows |
| S2 | Airy marketing spacing in tools (64–96px section gaps) | Pushes data below the fold for no reason | 16/24 region rhythm; densify before decorating |
| S3 | Radius ≥16px on tables, rows, inputs, toolbars | Soft blobs where crisp information belongs | 4–8px in Command/Configure |
| S4 | Rounded-square icon tile above every heading | The template signature | Headings stand alone; icons go beside labels where they add meaning |
| S5 | Three-line empty space around a two-column table | Structure not doing work | Fill the viewport with the job, not the frame |
| S6 | Center-aligned data or labels | Columns miscompare; labels orphan from controls | Left text, right numbers |
| S7 | Long, unbounded tables with no sticky header/columns | Scrolling loses the header = loses meaning | Sticky header; frozen key column; column priority |
| S8 | Commented-out CSS blocks left in the file | Dead weight + ambiguity: is it coming back? | Delete — git remembers |

## Data tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| D1 | Table + chart showing the same numbers | Redundancy; two sources of truth to keep in sync | One encoding per question: chart for shape/trend, table for exact values |
| D2 | Pie/donut for comparisons | Humans rank lengths, not angles | Bars; pie only for true part-of-whole with ≤5 slices |
| D3 | Dual-axis charts | Invents correlations; misleads | Two charts, or normalize one series |
| D4 | 3D or gradient-filled bars | Distortion + noise | Flat bars, direct labels |
| D5 | Undated, unsourced KPI numbers | Unverifiable = untrustworthy | "vs last 30 days" + source + definition |
| D6 | Progress/score bars with filled background tracks | Dashboard-UI clutter | Number + delta + tiny sparkline |

## Interaction tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| I1 | Bounce/elastic easing on feedback | Feels dated and toy-like in a tool | Cubic ease-out ≤300ms |
| I2 | `transition: all` | Slow, janky, unfocused | Transition the specific property, ≤200ms for feedback |
| I3 | Icon-only buttons without labels | Ambiguity; breaks new users and a11y | Label, or `aria-label` + tooltip; never bare mystery icons |
| I4 | Spinner for <1s predictable operations | Flicker and reflow | Optimistic update / skeleton that preserves layout |
| I5 | Hover-only reveals in dense UI | Invisible on touch; state hidden | Visible state, hover as amplification only |
| I6 | Confetti or interruption-motion in task flows | Breaks flow; user is working | Reward = faster completion, not fireworks |

## Content tells

| # | Tell | Why it's wrong | Fix |
|---|---|---|---|
| W1 | Invented metrics (`+47% conversion`) | Fabrication is the cardinal sin | Real data or a labeled placeholder |
| W2 | Error messages that apologize and don't instruct | "Something went wrong" helps nobody | What happened, why, how to fix |
| W3 | Button labels as system words ("Submit", "OK") | Not actionable | The action: "Save changes", "Send invoice" |
| W4 | Lorem ipsum / "TODO" shipped | Unfinished = untrustworthy | Real copy, or explicitly labeled placeholder + follow-up |
| W5 | Unlabeled filters, units, and thresholds | The interface lies by omission | Every number and control names its context |

## Detector mapping

`scripts/check.mjs` deterministically catches, with these rule ids: `banned-font` (T1),
`purple-blue-gradient` (C1), `pure-black` (C3), `pure-gray-text` (C2), `gray-on-color` (C2),
`radius-too-large` (S3), `elastic-easing` (I1), `transition-all` (I2), `slow-feedback` (I2),
`deprecated-motion` (blink/marquee), `commented-out-code` (S8, raw-line). The rest are
LLM-judged — keep this file loaded when auditing.
