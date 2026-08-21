# Domain: Spatial design & density

Spacing is the skeleton of scanability. Dense interfaces are not "less whitespace" — they are *whitespace
with a job*: every gap either groups or separates.

## The grid

- Base unit: **4px**; layout gaps on **8px**.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48. Use pairs per region, never ad-hoc values.
- Typical Command-register pairs: region padding 16/24; card padding 16; table cell 12/16 (comfortable) or 8/12 (compact); form field gap 8/12; section gap 24/32 — never 64+ except page-level.

## Alignment law

- Text left (RTL: right), numbers right, tabular.
- Headers align with the data column they head.
- Labels align with their controls on a shared edge; checkbox/radio groups align controls, not text.
- Icons sit on the same optical line as their 14px labels.
- Nothing is center-aligned except short confirmations, empty states, and login.

## Density is a system, not a knob bolted on

Name the density tier per surface and tokenize it:

| Tier | Row height | Cell padding | Use |
|---|---|---|---|
| Compact | 32–36px | 8/12 | expert daily tools, big tables, trading/ops |
| Comfortable | 40–48px | 12/16 | default for most tools |
| Airy | 56px+ | 16/24 | Configure, onboarding, low-frequency surfaces |

Rules:
- One density per surface (a density toggle is a feature — ship all tiers as tokens if promised).
- Density changes must not reflow layout mid-task.
- `densify` never removes content; it removes chrome, then spacing, then redundancy — in that order.

## Proximity = grouping; alignment = order; whitespace = emphasis

- Related controls touch (≤8px); unrelated regions separate (≥24px) — consistent across the app.
- A hairline or a 1px tinted border is cheaper than a 16px gap for grouping dense content; prefer it in tables.
- Vertical rhythm: rows of equal height, buttons of equal height within a group, and the same button height app-wide (e.g., 32px default, 40px primary forms).

## The fold is a design decision

For each Command surface, state the above-the-fold target in the surface brief (e.g., "40 ticket rows at
1440×900, 12 at 1280×720"). Audit against it; report the delta in `measure`.

## Bans (recap)

Marketing gaps (64px+) inside tools, 3/5/7px orphans, inconsistent pairs (12 top / 16 bottom), center-
aligned data, nested cards, elevation soup, row heights that change with content mid-list.
