# New work

Follow this when the request is a new surface (screen, page, section, flow) or a replacement visual
world for an existing one.

## Step 1 — Pick the register

Choose from Command / Configure / Record / Convince (see SKILL.md). Decide from the surface, not the
product. A tool's pricing page is Convince; a settings screen is Configure; a dashboard is Command.

## Step 2 — Inventory the real material

Before any visual decisions, collect the actual content and data:

- What columns/rows/fields/metrics actually exist? List them with types (number, date, enum, text, money, status).
- What are the three most frequent jobs on this surface? (Sort? Filter? Act? Monitor?)
- What does the user already know coming in, and what must the surface prove?
- What are the extremes: longest string, most columns, smallest screen, empty dataset, slowest load?

If the brief has no real data, define a schema and generate *representative but clearly placeholder* data. Never invent metrics.

## Step 3 — Write the job-per-viewport statement

One sentence per viewport class, e.g.: "Desktop ≥1280: a support engineer sees 40 open tickets, their age, owner, and severity, and can reassign two of them without leaving the page." This statement governs every later decision and is the acceptance test.

## Step 4 — Define the tokens

A compact, committed token set before code:

- **Color:** semantic roles only — surface, surface-raised, text, text-secondary, border, accent, plus status (max 4: danger/warn/success/info). 4–8 named values, each with a contrast-checked text pair.
- **Type:** a functional scale (see `domains/typography.md`). 4–6 sizes, tabular figures for data, one weight system.
- **Spacing:** one 4px-based scale; name the pairs (e.g., region 16/24, row 12/16, field 8/12).
- **Radius:** two values max (e.g., 4px fields, 8px cards) — nothing ≥16px in Command/Configure.
- **Density:** state the tier (compact / comfortable / airy) and its row height, cell padding, and visible-above-fold target.
- **Signature:** the one element this surface is remembered by — in product UI it is usually a *behavior* (a perfect empty state, a fast filter, a density toggle), not a decoration.

## Step 5 — Wireframe, then build

ASCII-wireframe the layout (regions and data flow) and check it against the job-per-viewport statement
*before* code. Then build with the five states in from the start — retrofitting states is how half the
defects of tool UI are born.

## Step 6 — Verify

Screenshot desktop + mobile, run `scripts/check.mjs`, fix in one batch, confirm once, stop. Re-read the
job-per-viewport statement and confirm each clause is visible.

## Refinement vs replacement

- **Refinement** keeps the incumbent identity, behavior, copy, and everything outside scope; ask before replacing factual copy.
- **Replacement** keeps product truth, content, function, and constraints, but treats the old look as evidence and anti-reference — pick the replacement world here and commit to it fully. Never split the difference into polish on the discarded look.
