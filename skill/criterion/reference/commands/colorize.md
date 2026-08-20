# Command: colorize

Add strategic color to monochromatic UIs — without turning the surface into a casino. The
reference playbook's colorize, tuned for the Command register: color enters a data UI only as
*meaning*, one role at a time.

## Steps

1. Inventory the current state (checker first): what color exists, which of it is decoration
   (gradients, tinted panels), and which statuses/actions currently have no color signal.
2. Decide the semantic system from the real states (`domains/color.md`): max 4 status colors
   (danger / warn / success / info) plus one accent — never more, never decorative.
3. Apply by meaning, in this order:
   - **Accent** on the active/selected/primary action — the one thing per region that should
     draw the eye.
   - **Status colors** only where a status genuinely exists — a badge, a border, a dot; the
     region's text stays on the neutral ramp.
   - **Tint the neutrals** toward the surface hue where the palette is cold.
4. Verify every new pairing against the contrast floor (domains/color.md): text ≥ 4.5:1, UI
   states ≥ 3:1, dark-mode pairs re-checked, and no color as the only signal (labels, icons,
   or shape accompany it).

## Rules

- Colorize encodes meaning — a color that can't name the state or action it signals is
  decoration and gets removed in the next `review`.
- The brief wins: a brand palette is honored; colorize works *within* it, not over it.
- Colorize changes the color system, never the layout or copy — `align`/`clarify` own those.
