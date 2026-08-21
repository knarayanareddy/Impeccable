# Domain: Typography

Typography is the primary hierarchy engine in product UI. In the Command register, type is functional
first, expressive only where it earns it.

## Choose a workhorse, deliberately

The font decision is a decision, never a default. Good data-capable workhorses (with strong figures and
screen-tuning):

- **IBM Plex Sans** — excellent tabular figures, engineering character, wide language coverage
- **Public Sans** — neutral, government-grade legibility, tabular figures
- **Source Sans 3** — reliable, open, good hinting
- **Inter** — acceptable *only if chosen for a reason* (say why); its default-status is the problem, not the font

For monospaced data (IDs, hashes, code): **IBM Plex Mono**, **JetBrains Mono**, or system `ui-monospace`
with `font-variant-numeric: tabular-nums slashed-zero` where relevant.

## The functional scale

Design a scale of 4–6 sizes. Dense UI lives small:

| Role | Size (approx.) | Weight | Notes |
|---|---|---|---|
| Page title | 18–20px | 600 | In tools, hierarchy comes from position + weight, not size |
| Section title | 14–15px | 600 | Uppercase never; add letter-spacing only at 11–12px labels |
| Body / cell | 13–14px | 400 | Line-height 1.4–1.5 |
| Dense data / caption | 11–12px | 400–500 | Must still pass 4.5:1 contrast |
| Numeric data | 13–14px | 400–500 | `tabular-nums` mandatory |

## Data rules

- **Tabular figures everywhere data appears**: values, tables, timestamps, IDs, chart labels.
- **Right-align numbers, left-align text.** Never center a column of numbers.
- **Decimal places consistent** per column; pad or round so rows compare vertically.
- **Units in the header** (`Revenue (USD)`, `Latency (ms)`), not per cell.
- **Dates in one format per surface**, ISO-ish when sortable (`2026-08-20 14:32`); relative time only as a supplement, never the only encoding.
- **Truncate with meaning**: ellipsize long strings, but keep the tail or the unique part visible where identity lives (IDs, emails). Full value on hover/focus, and copyable.

## Hierarchy without size

In dense UI you rarely have size to spare. Use these in order: position → weight → size → color. A 13px
bold label reads as a header without spending 4px. Color is the *last* hierarchy tool and must stay above
4.5:1.

## Line height and measure

- Cells and labels: 1.4–1.5 line-height; large display text may go 1.2.
- Body text in tools rarely exceeds 65ch; long-form Record surfaces target 60–75ch.
- Never `line-height: 1` on multi-line text; never below 1.3 for any data cell.

## Typography bans (recap)

Overused defaults, proportional figures in data, units per cell, ALL-CAPS eyebrows, font-size-based
shouting, decorative display fonts on data, letterspaced lowercase (the marketing tell).
