# Domain: Color & contrast

In product UI, color is a *semantic system*, not a palette. Every color encodes meaning; every meaning
has a contrast-checked text pairing.

## Build semantic tokens, not hex walls

```
surface            — app background (near-white, tinted, or dark)
surface-raised     — cards, panels, popovers, menus
text               — primary text (≥4.5:1 on surface)
text-secondary     — secondary text (still ≥4.5:1; de-emphasize via size/weight)
border             — hairlines and separators (≥3:1 only where the border conveys state)
accent             — selected, active, primary action (one hue)
danger / warn / success / info  — the four statuses, max
```

Four status colors maximum. More than four and status stops meaning anything.

## The contrast floor (WCAG)

- Text ≥ 4.5:1; large text (≥24px, or ≥18.66px bold) ≥ 3:1.
- UI components, state-conveying borders, icons ≥ 3:1.
- Focus indicators ≥ 3:1 against adjacent colors.
- **Chart series**: adjacent colors must be distinguishable by hue *and* labeled directly — never rely on color alone (color-vision safety).
- Check against the *composited* background (a token layered on a gradient or image needs measurement, not assumption).

Common failures to hunt: gray text on tinted backgrounds, white text on mid-tone accents, placeholder
text below 4.5:1, disabled text that vanished below 3:1, borders that silently convey selection.

## Tinted neutrals

Never pure black (`#000`) or pure gray (`#808080`, `#6b7280`). Tint neutrals toward the surface hue:

- Light surfaces: near-black like `#1a1d21` (blue-tinted) or `#1c1917` (warm-tinted); secondary text like `#4b5563`-family, hue-tinted, contrast-verified.
- Dark surfaces: near-white text `#e4e4e7`-family, never `#fff`-flood; keep dark surfaces at ~900-level lightness, not OLED black unless intentional.

Work in OKLCH when generating: keep lightness and chroma intentional; avoid hue shifts when
lightening/darkening a ramp (interpolate in OKLCH, not RGB).

## Dark mode

- Never invert blindly. Elevate surfaces (raised = lighter, not darker) and *desaturate* large areas.
- Re-check contrast pairs in dark mode specifically — accents that pass on white often fail on near-black.
- Charts need a dark-mode legend and axis palette, not just a background swap.

## Color for data

- **Categorical palettes:** ≤7 hues, maximum separation, consistent across the app. Provide one
  color-vision-safe sequence (e.g., blue/orange/green/pink/purple/yellow/teal, lightness-matched).
- **Sequential:** one hue, lightness ramp, for magnitudes.
- **Diverging:** only for data with a meaningful midpoint (deltas, z-scores).
- **Status mapping is global:** danger is always danger, in every table, chart, and badge. Same hex, same meaning, everywhere.

## Bans (recap)

Purple→blue gradients in product UI, gray-on-color text, pure black/gray, rainbow badges, decorative
accent usage, gradients inside bars, color as the only signal anywhere.
