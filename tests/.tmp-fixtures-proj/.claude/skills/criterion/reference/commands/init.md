# Command: init

Capture durable product context so every later command reads the same facts. One-time setup per project.

## Steps

1. Ask (once, in one message, only what's missing): the product's job, its primary users and their
   frequency of use, the three most frequent tasks, any committed brand/style constraints, and the
   framework/stack in use.
2. Inspect the codebase briefly to confirm: entry points, styling approach (CSS/Tailwind/CSS-in-JS),
   existing tokens or design system, current fonts and palette in use.
3. Write `PRODUCT.md` at the project root (or `.criterion/PRODUCT.md` if the root is crowded) — start from the template `assets/PRODUCT.example.md` — with:
   - Product: what it does, who uses it, how often
   - The three most frequent jobs per main surface
   - Audience register per surface (Command / Configure / Record / Convince)
   - Data: what the real data model is (tables/collections, key entities, statuses)
   - Constraints: framework, browser targets, i18n needs, a11y obligations (e.g., "WCAG AA for public
     sector")
4. Offer `DESIGN.md` (skip if the project has a real design system): tokens — type scale, semantic
   colors with contrast-verified pairs, spacing pairs, radius (two values max), density tier per
   surface, and the one signature behavior.
5. End with the recommended next step: usually `shape` for new work, `critique` for an existing surface.

## Rules

- Never ask what the code already answers; never re-ask across sessions (PRODUCT.md is the memory).
- Do not edit UI during init. This is a context-capturing command.
- Keep both files tight (<60 lines each); they are read on every future command, so precision beats prose.
