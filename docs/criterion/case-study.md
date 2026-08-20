# Case study: the generic AI dashboard → the criterion pass

A before/after case study driven by the deterministic checker — the same artifact strategy the
reference repo uses, with the measurement made by `scripts/check.mjs`.

## The before

A typical AI-generated ops dashboard (`demos/criterion/before.html`): Inter as a silent default,
the purple→blue gradient header, cards nested in cards, `#000` text, gray text on tinted badges
(`#9ca3af` on `#dbeafe`), 16px radii on data regions, elastic easing, and `transition: all
600ms`.

The checker's verdict (`node skill/criterion/scripts/check.mjs --strict demos/criterion/before.html`):

```
ERROR pure-black           before.html:9   body { font-family: Inter, … color: #000 … }
ERROR purple-blue-gradient before.html:11  background: linear-gradient(135deg, #6366f1, #3b82f6);
ERROR elastic-easing       before.html:14  cubic-bezier(0.68, -0.55, 0.265, 1.55)
WARN  banned-font          before.html:9   font family "Inter"
WARN  radius-too-large     before.html:13  border-radius: 16px (×4 more sites)
WARN  transition-all       before.html:14  transition: all 600ms (×2)
WARN  slow-feedback        before.html:14  600ms (×2)
WARN  pure-gray-text       before.html:24  #9ca3af (×2)
WARN  gray-on-color        before.html:29  #9ca3af on #dbeafe

criterion: 1 file(s) scanned · 5 error(s), 14 warning(s) · FAILED
```

Every tell is a named, measurable violation — not an opinion.

## The pass

One criterion pass (`densify` for the data regions, `quieter` for the noise, `typeset` for the
figures, `align` for the grid) produces `demos/criterion/after.html`: the same content, the same
jobs — with a deliberate workhorse font (Public Sans), tinted near-blacks, semantic accent and
status colors, 6px radii, tabular figures, a reserved-layout image (`width`/`height` +
`loading="lazy"`), 150ms property-specific transitions, and a visible focus ring.

```
criterion: 1 file(s) scanned · 0 error(s), 0 warning(s) · clean ✓
```

## The claim

The transformation is *verifiable in both directions*: the checker rejects the before and passes
the after. That is the criterion thesis — design quality with a receipt.
