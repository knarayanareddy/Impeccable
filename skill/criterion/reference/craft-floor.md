# Craft floor

Load this file **immediately before editing UI**. It is the quality floor, the absolute bans, and the
reflexes no detector catches. Every rule is non-negotiable unless the brief explicitly pins something
stronger.

## The numeric floor

1. **Contrast.** Body/label text ≥ 4.5:1 against its actual background; large text (≥24px or ≥18.66px bold) ≥ 3:1; UI components, borders that convey state, icons, and graphical objects ≥ 3:1; focus indicators ≥ 3:1 against adjacent colors. Verify against the *composited* background, not the design file. No exceptions for "hint", "muted", or "de-emphasized" essential text — de-emphasize with size, weight, or position, never with sub-threshold contrast.
2. **Focus.** Every interactive element has a visible focus indicator, keyboard-reachable, in a sensible tab order. Nothing is hover-only or click-only.
3. **Targets.** Primary targets ≥ 44×44 CSS px; secondary (in-line, low-frequency) ≥ 24×24 with adequate separation. Dense table row actions may go to 28px only with 12px+ spacing.
4. **Grid.** Every spacing value sits on a 4px base grid; layout gaps on 8px. No 3/5/7px orphans, no free-floating `padding: 13px`. Padding is consistent per region (one vertical pair, one horizontal pair).
5. **Alignment.** Text left-aligned (RTL: right); numbers right-aligned and tabular (`font-variant-numeric: tabular-nums`); headers aligned with their data; controls aligned to a shared edge; icons aligned on the same optical line as their labels. Nothing center-aligned except short confirmations and empty states.
6. **Data figures.** Every data value uses tabular figures, consistent decimal places, and units in the header or label — never repeated per cell unless they differ.
7. **Five states.** Every data region and form ships empty, loading, error, overflow (incl. long strings, many rows, narrow widths), and permission-denied/disabled states. No placeholder text left in shipped copy.
8. **Motion.** Task feedback ≤ 300ms; nothing bouncy or elastic; `prefers-reduced-motion` respected everywhere.
9. **Truth.** No invented metrics, testimonials, or data. Use real numbers or an explicitly marked placeholder. A chart without a source or a KPI without a definition is a defect.
10. **Semantics.** Real `<button>`, real `<table>` headers (or `role`), labels tied to inputs (`for`/`aria-label`), one `<h1>`, sensible landmarks. `div`-soup is a defect.

## Absolute bans (deterministic — most are caught by `scripts/check.mjs`)

- Overused fonts as defaults: Inter, Roboto, Arial, Open Sans, Lato, Montserrat, Poppins — choose deliberately or keep the system stack; never a silent default.
- Pure black (`#000` / `#000000`) for surfaces or text. Use tinted near-blacks.
- Pure grays (`#808080`, `#6b7280`, `#9ca3af`, `#a1a1aa`, ...) for essential text on light backgrounds — they fail 4.5:1 or feel dead. Tint them toward the hue of the surface.
- Gray text on colored backgrounds.
- Border-radius ≥ 16px on data-dense regions: tables, rows, cells, inputs in dense forms, toolbars. Radius is for big touch surfaces and marketing, not for information.
- Purple→blue gradients (`#6366f1`→`#3b82f6` family) in product UI.
- Bounce/elastic/back easing; `transition: all`; > 500ms animation on task feedback.
- Cards inside cards; nested shadows; multiple elevation levels on the same surface.
- Giant rounded icon tiles above every section heading.
- Charts duplicating tables (redundant encodings of the same data) and tables duplicating charts.
- Spinner-only loading for predictable operations (≤ 1s) — prefer optimistic update or skeleton that preserves layout.
- Confetti, fireworks, and interruption-motion inside task flows.

## Reflexes (no detector catches these)

- **The fold is a decision.** State what must be visible above the fold per surface and verify it. If a table shows 3 rows above the fold, that is a design choice — make it explicit.
- **One job per region.** Every card, panel, and section answers one question. If it answers two, split it.
- **Same thing, same place.** A control that appears on five screens has the same position, label, and behavior on all five.
- **Redundant chrome dies first.** When densifying, remove borders/shadows/backgrounds before touching content.
- **Every color earns its meaning.** If a color does not encode state or emphasis, it is decoration and gets removed in a product register.
- **State changes must be visible.** Any change to data, selection, or status must be perceivable within 100ms without a hover.
- **Interaction cost scales with frequency.** The 10×-a-day action gets more optimization than the 1×-a-year setting.
- **Screenshot both widths.** Desktop and mobile in one batched pass; fix in one batch; confirm once; stop.
