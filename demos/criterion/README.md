# Criterion demo — before/after

The reference-style conversion artifact: the same dashboard, before and after a criterion pass.

- **`before.html`** — the generic AI dashboard: Inter, purple→blue gradient, cards in cards,
  pure black, gray-on-tinted badges, 16px radius, elastic easing, `transition: all 600ms`.
- **`after.html`** — the criterion pass: Public Sans, tinted neutrals, 6px radius, semantic
  color, tabular figures, reserved image layout, 150ms ease-out, visible focus.

## Run it

```bash
node demos/criterion/run-demo.mjs
# before.html: exit 1 — the checker rejects the slop (errors + warnings)
# after.html:  exit 0 — clean, the floor holds
```

Or open both files in a browser and run the extension (see the docs page) on each.
