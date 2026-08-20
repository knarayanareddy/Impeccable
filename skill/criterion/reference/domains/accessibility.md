# Domain: Accessibility

The quality floor of this skill is a WCAG floor — accessibility is not an extra pass, it is the pass.
`audit` runs the technical checks; this file is the standing reference.

## The non-negotiable floor

- **Contrast:** text ≥ 4.5:1 (large ≥ 3:1); state-conveying UI ≥ 3:1; focus ≥ 3:1. Chart series labeled
  directly, not color-only.
- **Keyboard:** every interactive element focusable, operable, and visible; logical tab order; no
  keyboard traps; Esc closes; focus returns to the trigger after modal close.
- **Targets:** ≥ 44×44px primary, ≥ 24×24 secondary with separation.
- **Semantics:** real elements or correct ARIA — `<button>` for buttons, `<th scope>` for headers,
  `label`/`aria-label` on every input, one `<h1>`, landmarks for regions, `aria-live` for announcements.
- **Motion:** `prefers-reduced-motion` honored; nothing flashes >3 times/sec; nothing autoplays
  un-pausably.
- **Zoom/resize:** usable at 200% zoom and at 320px width without horizontal page scroll (data tables
  may scroll internally with a frozen identity column).

## Screen reader quality for data UI

- Tables announce headers per cell (scope/th properly set); caption states what the table answers.
- Chart accessibility: a text summary of the finding ("Weekend deploys fail 3× more than weekday"),
  plus a data table alternative; never an image-only chart.
- Dynamic changes announce via `aria-live="polite"` (results count after filtering, save confirmation);
  `assertive` only for urgent errors.
- Icon-only controls carry labels; decorative icons are `aria-hidden`.

## Cognitive accessibility

- Consistent placement and naming (same thing, same place).
- Progressive disclosure for complex actions; defaults that are safe.
- Clear, specific error recovery (see ux-writing.md).
- No time-limited content without pause/extend; no needless motion or parallax in task flows.

## Responsive & touch

- Touch targets ≥44px with spacing; hover-only content has a touch path.
- 320px is a supported width class — design the collapsed data view, not an apology.

## The audit checklist lives in `commands/audit.md`

Run it per surface: contrast scan (check.mjs + manual on composites), keyboard walk of every flow,
screen-reader pass of one table + one form, zoom test, 320/768/1280 render check, reduced-motion check.
