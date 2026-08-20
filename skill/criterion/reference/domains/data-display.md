# Domain: Data display (tables, charts, dashboards)

The differentiator domain. Product UI is mostly *data displayed well*. This file is the reference for
tables, charts, and dashboards.

## Tables

- **One job per table.** A table answers one question ("which jobs are failing?"). Columns that serve
  other questions move to a detail view or a second table.
- **Column priority is designed, not accidental:** key columns first and frozen where it helps; sortable
  columns indicated; column order stable across sessions.
- **Sticky header** on any scrollable table; **frozen first column** when row identity matters on
  horizontal scroll.
- **Alignment:** text left, numbers right (tabular), dates right or fixed-width, status/icon centered
  only when ≤32px wide, boolean as icon or "—/✓" not words.
- **Density per tier** (see spatial.md): compact 32–36px rows; hairline separators beat zebra stripes for
  scanability; zebra only when columns are very wide and sparse.
- **Truncation with identity:** keep the unique part of the string; title + copy affordance on hover;
  never let a cell silently hide a value a user needs.
- **Five states** every table ships: empty (with a next action), loading (layout-preserving skeleton),
  error (retry + context), overflow (horizontal scroll + frozen identity, or prioritized collapse), and
  permission-denied (what's hidden and why).
- **Selection and bulk actions:** visible, reversible, with a count ("3 selected") and a clear exit.

## Charts

**Pick the encoding from the question, not the dataset:**

| Question | Encoding |
|---|---|
| Compare categories | Horizontal bars (labels readable; vertical bars only if ≤6 short labels) |
| Show trend over time | Line (time on x, always); area only to stack parts of a whole |
| Part of a whole | Donut/pie only ≤5 slices, values labeled; otherwise 100% stacked bar |
| Distribution | Histogram / box plot / strip, not pie |
| Correlation | Scatter, not dual-axis lines |
| Rank | Ordered bars with the value labeled |

Rules:
- **Label directly** (value at the bar/point) rather than forcing gridline reading; gridlines are
  de-emphasized (`border`-level contrast, not `text`-level noise).
- **Y-axis starts at 0 for bars**; if truncated, state it loudly ("axis starts at 80").
- **Never dual-axis** without a demonstrable cause; two charts beat one misleading chart.
- **Time axis shows a sensible window** and a visible "now" boundary; live charts show their update rate.
- **Legend or direct labels, not both**; series colors follow the global categorical palette; markers
  for color-vision safety (dash patterns or labels).
- **No 3D, no gradient fills, no decorative gridlines.**
- Every chart has a title that states the *finding* ("Weekend deploys fail 3× more"), not the data
  ("Deploys by day") — when the finding is unknown, the title states the question.
- Charts and tables never duplicate each other: chart for shape/trend, table for exact values.

## Dashboards

- **A dashboard is a ranked answer to one question per card.** If a card doesn't answer a question the
  viewer asks, it is decoration.
- KPI card anatomy: label (what), value (tabular, exact), delta (vs what period), sparkline (shape), and
  status color only when thresholds exist.
- **Information flow:** most important card top-left (LTR); grouping by topic, not by chart type.
- **Above the fold is a statement:** name the metrics that must be visible without scrolling and verify.
- Consistency: same date window, same currency format, same status colors on every card.
- Empty/error states per card: "No data in this window — [extend range]" beats a hollow axis.

## Data truth (non-negotiable)

Never invent numbers. Every KPI, chart, and table needs a source and a definition; placeholders are
explicitly marked and enumerated in the handoff. Precision is consistent per column; units live in
headers; timestamps carry timezones.
