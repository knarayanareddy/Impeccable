# Domain: Interaction

Tools are used with keyboard, mouse, and touch — usually all three in a day. Every control must work
with all of them.

## Forms

- **Label placement:** above the field (fastest scanning) for forms; left-aligned only for long expert
  forms. Labels are always real `<label>` elements tied to the input.
- **Required vs optional:** mark optional, not required (fewer red asterisks); explain why a field is
  needed when it is not obvious.
- **Validation timing:** validate on blur for most fields; on submit for the form; never on every
  keystroke. Errors appear next to the field, not only in a top banner, and they state the fix.
- **Input affordance matches content:** date → date picker + free text; money → numeric with unit;
  choice of ≤5 → radios; ≥6 → select with search.
- **Defaults:** pre-fill the safe, common value; destructive or expensive actions default to off.
- **Submit state:** every submit button has loading, disabled-with-reason, and success/failure states;
  double-submit is impossible.

## Focus and keyboard

- Visible focus ring ≥3:1 on every interactive element; never remove outlines without a replacement.
- Tab order follows visual order; forms are keyboard-completable; dropdowns close on Esc and move
  selection with arrows; modals trap focus and restore it on close.
- Keyboard shortcuts for the 10×-a-day actions, displayed where they're used, not only in docs.

## Selection and state

- Selection is always visible without hover (checkboxes, row highlight).
- The same action looks and behaves the same everywhere; the primary action of a screen is visually
  dominant exactly once (one filled button per region, not five).
- Destructive actions require confirmation proportional to cost: inline "Delete?" with undo for
  reversible; typed confirmation only for irreversible and expensive.

## Tables, filters, and search (the tool triad)

- **Filtering is progressive disclosure:** a few visible filters (the 80%), "more filters" for the rest;
  applied filters always render as removable chips *with a count of results*.
- Filters and search have a single visible empty state: "No results for X — [clear filters]".
- Sort state is visible (arrow + direction) on the active column; default sort is meaningful.
- Table row actions appear on hover *and* on focus, and are also reachable via a row menu on touch.
- Pagination shows where you are and how many ("Page 3 of 12 · 240 rows") — or infinite scroll with a
  restore-position affordance. Never silent truncation ("showing 10 of …").

## Feedback patterns

- Toasts for transient confirmation only, max one at a time, ≥4s for real reading, never stacked.
- Errors are persistent and actionable: what happened, why, how to fix, where to go.
- Optimistic updates always resolve visibly — success (subtle confirm) or rollback with a message.

## Bans (recap)

Icon-only mystery buttons, hover-only reveals, dead-end empty states, "Something went wrong",
un-undoable destructive actions without confirmation, focus rings removed, stacked toasts, silent
truncation.
