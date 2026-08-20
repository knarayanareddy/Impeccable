# Command: measure

The quantitative pass. Turns "feels good" into numbers. Complements `critique` (judgment) and `audit`
(defects). No code edits.

## What gets measured

1. **Contrast:** sample every distinct text/icon/border pairing on the composited background; report
   min / distribution / count below 4.5:1 (or 3:1 where the larger threshold applies). Use a real
   computation (script or contrast tool), never an eyeball estimate.
2. **Alignment & grid:** measure spacing values in the rendered UI (devtools) and report the set. Count
   values off the 4px grid, inconsistent pairs (12 top / 16 bottom), and stray values (3, 5, 7, 13px).
3. **Typography:** sizes in use → is the scale defined and adhered to? Are data values tabular? Units
   in headers? Decimal places consistent per column?
4. **Density:** above-the-fold count per viewport — rows visible in the main table at 1440×900 and
   1280×720, cards visible, controls reachable without scroll. Report row height, cell padding, and
   the tier they imply vs the tier the surface claims.
5. **Targets:** smallest interactive target on the surface; count under 44×44 (primary) / 24×24
   (secondary).
6. **States:** count of data regions and forms vs count of regions with all five states implemented.
7. **Motion:** durations in use — any over 500ms for feedback? Elastic easing? `transition: all`?

## Output

A measurement report:

```
Surface: /tickets
Register: Command · Tier: comfortable · Above-fold target: 40 rows @1440×900

Contrast    min 3.1:1 (status chip "pending") · 3 pairings <4.5:1 · median 7.9:1
Grid        14 of 42 spacing values off-grid · 3 inconsistent pairs
Type        6 sizes (scale says 5) · tabular: partial (2 tables missing)
Density     31 rows above fold @1440 (target 40) · row 44px, cell 12/16 → comfortable ✓
Targets     smallest 24px (icon button in row) · 8 under 44px
States      5 of 9 regions have all five states
Motion      max 600ms card hover · 1 elastic ease · 2 transition:all
```

Then the ranked delta list: what to change to hit the craft floor, cheapest first.

## Rules

- Numbers with units, always; screenshots to back the visual claims.
- Measure the rendered output, not the source alone (computed styles matter).
- If a metric can't be measured with available tooling, report it as "not measured" — never guess a number.
