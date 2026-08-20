# Command: critique

Heuristic UX review of the target with scores, in the language of design craft. Subjective judgment,
structured — not a defect scan (that's `audit`). No code edits.

## Scorecard (1–5 each)

| Dimension | The question |
|---|---|
| Job clarity | Can a returning user name what this surface is for in 5 seconds? |
| Scanability | Is the hierarchy visible in 3 seconds — where do the eyes land first, second? |
| Density | Is information per viewport intentional for the tier? Overcrowded or over-aired? |
| Hierarchy | Does order/scale/weight/color encode the right ranking of information? |
| Consistency | Do repeated elements (buttons, tables, badges, spacing) behave identically? |
| States | Empty/loading/error/overflow/permission — present and well-designed? |
| Clarity of copy | Labels, buttons, errors: specific and actionable? |
| Efficiency | Can the three most frequent jobs be done without detours (filters, sort, bulk)? |
| Craft | Alignment, grid, type figures, contrast — the floor items, holistically |
| Emotional fit | Does it feel engineered, calm, trustworthy — right register for the job? |

## Steps

1. Load the surface brief (PRODUCT.md / DESIGN.md) if present; state the register and density tier.
2. Walk the surface as three users: first-time, returning, expert-with-keyboard. Note where each
   stumbles.
3. Screenshot and annotate: cite the exact element for every claim.
4. Score each dimension and write one "what's working" and one "what's not" line per dimension — no
   generic praise.
5. Deliver: scorecard table, the three highest-leverage fixes (ranked by frequency of the job they
   affect), and one "bold move" — the single change that would most elevate the surface.

## Rules

- Critique the work, not the author; every criticism names an element and a reason.
- Never invent user data or opinions; if a usability claim needs evidence, mark it "to verify".
- Offer no code until asked — critique ends with the review.
