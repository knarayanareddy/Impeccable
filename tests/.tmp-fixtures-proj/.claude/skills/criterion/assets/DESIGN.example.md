# DESIGN.md — example shape

The canonical design-context file written by `init` / `document`. Copy this shape; keep it tight
(it is read on every command).

```markdown
# Type
display: Plus Jakarta Sans (headings only) · body: Public Sans · data: tabular-nums enabled
scale: 18 / 16 / 14 / 13 / 12

# Color (semantic, contrast-verified pairs)
surface: #f7f8fa · text: #1a1d21 (14.3:1) · text-secondary: #4b5563 (7.5:1)
accent: #2563eb · on-accent: #ffffff (4.6:1)
danger: #dc2626 · warn: #b45309 · success: #15803d · info: #1d4ed8
(each status pairs with its readable text color — verified on the surface it sits on)

# Spacing (4px grid)
region 16/24 · card 16 · table row 12/16 (comfortable) · field gap 8/12 · section 24/32

# Radius
6px fields · 8px cards — nothing ≥16px in Command/Configure surfaces

# Density
tier: comfortable · row height 44px · above-fold target: 40 rows @ 1440×900, 12 @ 1280×720

# Signature
<the one element or behavior this surface is remembered for — e.g. "the live-updating
filter-chip row with result count">
```
